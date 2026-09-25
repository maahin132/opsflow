from rest_framework.permissions import BasePermission

from .models import OrganizationMember


class IsOrganizationOwner(BasePermission):
    """
    Allows access only to organization owners.
    """

    message = "Only the organization owner can perform this action."

    def has_object_permission(self, request, view, obj):
        organization = self._get_organization(obj)

        if organization is None:
            return False

        return OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role=OrganizationMember.Role.OWNER,
        ).exists()

    @staticmethod
    def _get_organization(obj):
        if hasattr(obj, "organization"):
            return obj.organization

        if obj.__class__.__name__ == "Organization":
            return obj

        return None


class IsOrganizationAdmin(BasePermission):
    """
    Allows access to organization owners and admins.
    """

    message = "Only organization owners or admins can perform this action."

    allowed_roles = {
        OrganizationMember.Role.OWNER,
        OrganizationMember.Role.ADMIN,
    }

    def has_object_permission(self, request, view, obj):
        organization = self._get_organization(obj)

        if organization is None:
            return False

        return OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role__in=self.allowed_roles,
        ).exists()

    @staticmethod
    def _get_organization(obj):
        if hasattr(obj, "organization"):
            return obj.organization

        if obj.__class__.__name__ == "Organization":
            return obj

        return None


class IsOrganizationManager(BasePermission):
    """
    Allows access to owners, admins, and managers.
    """

    message = "You do not have manager-level permissions."

    allowed_roles = {
        OrganizationMember.Role.OWNER,
        OrganizationMember.Role.ADMIN,
        OrganizationMember.Role.MANAGER,
    }

    def has_object_permission(self, request, view, obj):
        organization = self._get_organization(obj)

        if organization is None:
            return False

        return OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role__in=self.allowed_roles,
        ).exists()

    @staticmethod
    def _get_organization(obj):
        if hasattr(obj, "organization"):
            return obj.organization

        if obj.__class__.__name__ == "Organization":
            return obj

        return None