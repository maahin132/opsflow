
from django.db import models, transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.organizations.models import Organization, OrganizationMember
from apps.organizations.permissions import IsOrganizationManager

from .models import Project, ProjectMember
from .serializers import ProjectMemberSerializer, ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = Project.objects.filter(
            organization__members__user=user,
            organization__is_active=True,
        ).select_related(
            "organization",
            "owner",
        ).prefetch_related(
            "project_members__user",
        ).distinct()

        organization_id = self.request.query_params.get(
            "organization"
        )

        if organization_id:
            queryset = queryset.filter(
                organization_id=organization_id
            )

        return queryset

    def get_permissions(self):
        if self.action in [
            "update",
            "partial_update",
            "destroy",
            "add_member",
            "remove_member",
        ]:
            permission_classes = [
                permissions.IsAuthenticated,
                IsOrganizationManager,
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
        organization = serializer.validated_data["organization"]
        user = self.request.user

        membership = get_object_or_404(
            OrganizationMember,
            organization=organization,
            user=user,
        )

        if membership.role not in [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.ADMIN,
            OrganizationMember.Role.MANAGER,
        ]:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only organization owners, admins, or managers "
                "can create projects."
            )

        serializer.save(owner=user)

    @action(
        detail=True,
        methods=["post"],
        url_path="members",
    )
    @transaction.atomic
    def add_member(self, request, pk=None):
        project = self.get_object()

        user_id = request.data.get("user")
        role = request.data.get(
            "role",
            ProjectMember.Role.MEMBER,
        )

        if not user_id:
            return Response(
                {"detail": "User ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_roles = [
            choice[0]
            for choice in ProjectMember.Role.choices
        ]

        if role not in valid_roles:
            return Response(
                {"detail": "Invalid project role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organization_membership = OrganizationMember.objects.filter(
            organization=project.organization,
            user_id=user_id,
        ).first()

        if not organization_membership:
            return Response(
                {
                    "detail": (
                        "User must belong to the project's organization."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership, created = ProjectMember.objects.get_or_create(
            project=project,
            user_id=user_id,
            defaults={
                "role": role,
                "assigned_by": request.user,
            },
        )

        if not created:
            return Response(
                {"detail": "User is already assigned to this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProjectMemberSerializer(membership)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path="members/(?P<user_id>[^/.]+)",
    )
    @transaction.atomic
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()

        membership = get_object_or_404(
            ProjectMember,
            project=project,
            user_id=user_id,
        )

        membership.delete()

        return Response(
            {"detail": "Project member removed successfully."},
            status=status.HTTP_200_OK,
        )