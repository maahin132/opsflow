
from rest_framework import serializers

from apps.organizations.models import Organization, OrganizationMember
from .models import Project, ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    username = serializers.ReadOnlyField(source="user.username")
    assigned_by_email = serializers.ReadOnlyField(
        source="assigned_by.email"
    )

    class Meta:
        model = ProjectMember
        fields = [
            "id",
            "user",
            "username",
            "user_email",
            "role",
            "assigned_by",
            "assigned_by_email",
            "joined_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "username",
            "user_email",
            "assigned_by",
            "assigned_by_email",
            "joined_at",
            "updated_at",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        source="organization",
        write_only=True,
    )

    organization_name = serializers.ReadOnlyField(
        source="organization.name"
    )

    owner_email = serializers.ReadOnlyField(
        source="owner.email"
    )

    members = ProjectMemberSerializer(
        source="project_members",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "organization_id",
            "organization_name",
            "name",
            "description",
            "code",
            "status",
            "priority",
            "owner",
            "owner_email",
            "start_date",
            "due_date",
            "is_archived",
            "members",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "owner_email",
            "organization_name",
            "members",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        due_date = attrs.get(
            "due_date",
            getattr(self.instance, "due_date", None),
        )

        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError({
                "due_date": "Due date cannot be before the start date."
            })

        return attrs

    def validate_organization_id(self, organization):
        user = self.context["request"].user

        is_member = OrganizationMember.objects.filter(
            organization=organization,
            user=user,
        ).exists()

        if not is_member:
            raise serializers.ValidationError(
                "You must belong to this organization."
            )

        if not organization.is_active:
            raise serializers.ValidationError(
                "Cannot create projects in an inactive organization."
            )

        return organization