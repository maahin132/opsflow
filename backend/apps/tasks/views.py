from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.organizations.models import OrganizationMember
from apps.projects.models import ProjectMember

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

        serializer.save(created_by=user)

    def perform_update(self, serializer):
        serializer.save()

    @action(
        detail=True,
        methods=["post"],
        url_path="assign",
    )
    @transaction.atomic
    def assign(self, request, pk=None):
        task = self.get_object()

        user_id = request.data.get("user")

        if not user_id:
            return Response(
                {"detail": "User ID is required."},
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

        project_membership = ProjectMember.objects.filter(
            project=task.project,
            user_id=user_id,
        ).first()

        if not project_membership:
            return Response(
                {
                    "detail": (
                        "User must be a member of this project."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        task.assigned_to_id = user_id
        task.save(
            update_fields=["assigned_to", "updated_at"]
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

        task.status = new_status
        task.save()

        return Response(
            TaskSerializer(
                task,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )