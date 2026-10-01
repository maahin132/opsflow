from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.organizations.models import OrganizationMember
from apps.projects.models import ProjectMember
from apps.comments.models import TaskActivity

from .models import Task
from .serializers import TaskSerializer


class IsTaskOrganizationManager(permissions.BasePermission):
    """
    Allows organization owners, admins, and managers
    to modify or delete tasks.
    """

    def has_object_permission(self, request, view, obj):
        organization = obj.project.organization

        return OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role__in=[
                OrganizationMember.Role.OWNER,
                OrganizationMember.Role.ADMIN,
                OrganizationMember.Role.MANAGER,
            ],
        ).exists()


class TaskViewSet(viewsets.ModelViewSet):

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            Task.objects.filter(
                project__organization__members__user=user,
                project__organization__is_active=True,
            )
            .select_related(
                "project",
                "project__organization",
                "assigned_to",
                "created_by",
            )
            .distinct()
        )

        project_id = self.request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        priority_filter = self.request.query_params.get("priority")
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)

        assigned_to = self.request.query_params.get("assigned_to")
        if assigned_to:
            queryset = queryset.filter(
                assigned_to_id=assigned_to
            )

        return queryset

    def get_permissions(self):
        if self.action in [
            "update",
            "partial_update",
            "destroy",
        ]:
            permission_classes = [
                permissions.IsAuthenticated,
                IsTaskOrganizationManager,
            ]
        else:
            permission_classes = [
                permissions.IsAuthenticated,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        user = self.request.user

        membership = get_object_or_404(
            OrganizationMember,
            organization=project.organization,
            user=user,
        )

        if membership.role not in [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.ADMIN,
            OrganizationMember.Role.MANAGER,
        ]:
            raise PermissionDenied(
                "Only organization owners, admins, or managers "
                "can create tasks."
            )

        task = serializer.save(created_by=user)
        TaskActivity.objects.create(
            task=task,
            actor=user,
            action="created",
            description=f"Created task {task.title}",
        )

    def perform_update(self, serializer):
        task = serializer.instance
        previous_values = {
            field: getattr(task, field)
            for field in serializer.validated_data
        }
        updated_task = serializer.save()
        changed_fields = [
            field
            for field, previous_value in previous_values.items()
            if getattr(updated_task, field) != previous_value
        ]

        if changed_fields:
            TaskActivity.objects.create(
                task=updated_task,
                actor=self.request.user,
                action="updated",
                description=(
                    "Updated task details: "
                    + ", ".join(field.replace("_", " ") for field in changed_fields)
                ),
                metadata={"fields": changed_fields},
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="assign",
    )
    @transaction.atomic
    def assign(self, request, pk=None):
        task = self.get_object()

        if "user" not in request.data:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.data.get("user")
        if user_id is not None:
            if isinstance(user_id, bool):
                return Response(
                    {"user": ["User ID must be a positive integer or null."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                return Response(
                    {"user": ["User ID must be a positive integer or null."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user_id <= 0:
                return Response(
                    {"user": ["User ID must be a positive integer or null."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        membership = OrganizationMember.objects.filter(
            organization=task.project.organization,
            user=request.user,
            role__in=[
                OrganizationMember.Role.OWNER,
                OrganizationMember.Role.ADMIN,
                OrganizationMember.Role.MANAGER,
            ],
        ).first()

        if not membership:
            raise PermissionDenied(
                "Only organization managers can assign tasks."
            )

        if user_id:
            is_workspace_member = OrganizationMember.objects.filter(
                organization=task.project.organization,
                user_id=user_id,
            ).exists()

            if not is_workspace_member:
                return Response(
                    {
                        "detail": (
                            "User must belong to the task's workspace."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project_membership = ProjectMember.objects.filter(
                project=task.project,
                user_id=user_id,
            ).select_related("user").first()

            if not project_membership:
                return Response(
                    {
                        "detail": (
                            "User must be a member of this project."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            assigned_user = project_membership.user
        else:
            assigned_user = None

        task.assigned_to = assigned_user
        task.save(
            update_fields=["assigned_to", "updated_at"]
        )
        TaskActivity.objects.create(
            task=task,
            actor=request.user,
            action="assigned" if task.assigned_to_id else "unassigned",
            description=(
                f"Assigned task to {task.assigned_to.username}"
                if task.assigned_to_id
                else "Removed task assignee"
            ),
            metadata={"assigned_to": task.assigned_to_id},
        )

        return Response(
            TaskSerializer(
                task,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="status",
    )
    def update_status(self, request, pk=None):
        task = self.get_object()

        new_status = request.data.get("status")

        valid_statuses = [
            choice[0]
            for choice in Task.Status.choices
        ]

        if new_status not in valid_statuses:
            return Response(
                {
                    "detail": "Invalid task status.",
                    "valid_statuses": valid_statuses,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        is_manager = OrganizationMember.objects.filter(
            organization=task.project.organization,
            user=user,
            role__in=[
                OrganizationMember.Role.OWNER,
                OrganizationMember.Role.ADMIN,
                OrganizationMember.Role.MANAGER,
            ],
        ).exists()

        is_assignee = task.assigned_to_id == user.id

        if not is_manager and not is_assignee:
            raise PermissionDenied(
                "Only project managers or the assigned user "
                "can update task status."
            )

        previous_status = task.status
        task.status = new_status
        task.save()

        if previous_status != new_status:
            TaskActivity.objects.create(
                task=task,
                actor=user,
                action="status_changed",
                description=(
                    f"Changed status from {previous_status.replace('_', ' ').title()} "
                    f"to {new_status.replace('_', ' ').title()}"
                ),
                metadata={
                    "from": previous_status,
                    "to": new_status,
                },
            )

        return Response(
            TaskSerializer(
                task,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )