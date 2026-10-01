from django.db import models, transaction
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from apps.comments.models import TaskActivity
from apps.projects.models import ProjectMember
from apps.tasks.models import Task

from .models import Organization, OrganizationMember
from .permissions import IsOrganizationAdmin, IsOrganizationOwner
from .serializers import OrganizationMemberSerializer, OrganizationSerializer


User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    API for creating and managing organizations.

    Access rules:

    - Authenticated users can create organizations.
    - Users can view organizations where they are:
        - the owner
        - or an organization member.
    - Only the organization owner can update or delete it.
    """

    serializer_class = OrganizationSerializer

    def get_permissions(self):
        """
        Apply different permissions depending on the action.
        """

        if self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [
                permissions.IsAuthenticated,
                IsOrganizationOwner,
            ]
        elif self.action in ["add_member", "member_detail"]:
            permission_classes = [
                permissions.IsAuthenticated,
                IsOrganizationAdmin,
            ]
        else:
            permission_classes = [
                permissions.IsAuthenticated,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_queryset(self):
        """
        Return only organizations accessible to the
        currently authenticated user.
        """

        user = self.request.user

        return (
            Organization.objects.filter(
                models.Q(owner=user)
                | models.Q(members__user=user)
            )
            .select_related("owner")
            .prefetch_related("members__user")
            .distinct()
        )

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Create the organization and automatically make
        the current user its OWNER.
        """

        organization = serializer.save(
            owner=self.request.user
        )

        OrganizationMember.objects.create(
            organization=organization,
            user=self.request.user,
            role=OrganizationMember.Role.OWNER,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="members",
    )
    @transaction.atomic
    def add_member(self, request, pk=None):
        organization = self.get_object()
        email_value = request.data.get("email")
        email = email_value.strip() if isinstance(email_value, str) else ""
        role = request.data.get(
            "role",
            OrganizationMember.Role.MEMBER,
        )
        valid_roles = {
            OrganizationMember.Role.ADMIN,
            OrganizationMember.Role.MANAGER,
            OrganizationMember.Role.EMPLOYEE,
            OrganizationMember.Role.MEMBER,
        }

        if not email:
            return Response(
                {"email": ["Email is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(role, str) or role not in valid_roles:
            return Response(
                {"role": ["Choose a valid non-owner organization role."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actor_role = organization.members.filter(
            user=request.user
        ).values_list("role", flat=True).first()

        if role == OrganizationMember.Role.ADMIN and actor_role != OrganizationMember.Role.OWNER:
            return Response(
                {"detail": "Only the organization owner can grant the admin role."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()
        if user is None:
            return Response(
                {"email": ["No active OpsFlow user exists with this email."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        membership, created = OrganizationMember.objects.get_or_create(
            organization=organization,
            user=user,
            defaults={"role": role},
        )
        if not created:
            return Response(
                {"detail": "This user is already a workspace member."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            OrganizationMemberSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch", "delete"],
        url_path=r"members/(?P<user_id>[^/.]+)",
    )
    @transaction.atomic
    def member_detail(self, request, pk=None, user_id=None):
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return Response(
                {"user_id": ["User ID must be a positive integer."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user_id <= 0:
            return Response(
                {"user_id": ["User ID must be a positive integer."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organization = self.get_object()
        membership = get_object_or_404(
            OrganizationMember.objects.select_related("user"),
            organization=organization,
            user_id=user_id,
        )

        if membership.user_id == organization.owner_id:
            return Response(
                {"detail": "The organization owner cannot be removed or have their role changed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actor_role = organization.members.filter(
            user=request.user
        ).values_list("role", flat=True).first()

        if membership.role == OrganizationMember.Role.ADMIN and actor_role != OrganizationMember.Role.OWNER:
            return Response(
                {"detail": "Only the organization owner can manage an admin."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.method == "DELETE":
            assigned_tasks = list(
                Task.objects.filter(
                    project__organization=organization,
                    assigned_to=membership.user,
                ).only("id", "title")
            )
            TaskActivity.objects.bulk_create([
                TaskActivity(
                    task=task,
                    actor=request.user,
                    action="unassigned",
                    description=(
                        "Removed task assignee because "
                        "the user left the workspace"
                    ),
                    metadata={"removed_user_id": membership.user_id},
                )
                for task in assigned_tasks
            ])
            if assigned_tasks:
                Task.objects.filter(
                    id__in=[task.id for task in assigned_tasks]
                ).update(
                    assigned_to=None,
                    updated_at=timezone.now(),
                )
            ProjectMember.objects.filter(
                project__organization=organization,
                user=membership.user,
            ).delete()
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        role = request.data.get("role")
        valid_roles = {
            OrganizationMember.Role.ADMIN,
            OrganizationMember.Role.MANAGER,
            OrganizationMember.Role.EMPLOYEE,
            OrganizationMember.Role.MEMBER,
        }
        if not isinstance(role, str) or role not in valid_roles:
            return Response(
                {"role": ["Choose a valid non-owner organization role."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role == OrganizationMember.Role.ADMIN and actor_role != OrganizationMember.Role.OWNER:
            return Response(
                {"detail": "Only the organization owner can grant the admin role."},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership.role = role
        membership.save(update_fields=["role", "updated_at"])
        return Response(OrganizationMemberSerializer(membership).data)