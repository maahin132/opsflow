from django.db import models, transaction

from rest_framework import permissions, viewsets

from .models import Organization, OrganizationMember
from .permissions import IsOrganizationOwner
from .serializers import OrganizationSerializer


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
            .prefetch_related("members")
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