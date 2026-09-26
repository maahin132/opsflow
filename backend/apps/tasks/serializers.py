from rest_framework import serializers

from apps.projects.models import Project, ProjectMember
from apps.organizations.models import OrganizationMember

from .models import Task


class TaskSerializer(serializers.ModelSerializer):

    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        source="project",
        write_only=True,
    )

    project_name = serializers.ReadOnlyField(
        source="project.name"
    )

    assigned_to_email = serializers.ReadOnlyField(
        source="assigned_to.email"
    )

    created_by_email = serializers.ReadOnlyField(
        source="created_by.email"
    )

    class Meta:
        model = Task

        fields = [
            "id",
            "project_id",
            "project_name",
            "title",
            "description",
            "code",
            "status",
            "priority",
            "assigned_to",
            "assigned_to_email",
            "created_by",
            "created_by_email",
            "start_date",
            "due_date",
            "completed_at",
            "is_archived",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "project_name",
            "created_by",
            "created_by_email",
            "assigned_to_email",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def validate_project_id(self, project):
        user = self.context["request"].user

        is_member = OrganizationMember.objects.filter(
            organization=project.organization,
            user=user,
        ).exists()

        if not is_member:
            raise serializers.ValidationError(
                "You must belong to this project's organization."
            )

        if not project.organization.is_active:
            raise serializers.ValidationError(
                "Cannot create tasks in an inactive organization."
            )

        if project.is_archived:
            raise serializers.ValidationError(
                "Cannot create tasks in an archived project."
            )

        return project

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
                "due_date": (
                    "Due date cannot be before the start date."
                )
            })

        project = attrs.get(
            "project",
            getattr(self.instance, "project", None),
        )

        assigned_to = attrs.get(
            "assigned_to",
            getattr(self.instance, "assigned_to", None),
        )

        if project and assigned_to:
            is_project_member = ProjectMember.objects.filter(
                project=project,
                user=assigned_to,
            ).exists()

            if not is_project_member:
                raise serializers.ValidationError({
                    "assigned_to": (
                        "The assigned user must be a member "
                        "of this project."
                    )
                })

        return attrs