from django.contrib import admin

from .models import Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1
    autocomplete_fields = ["user", "assigned_by"]

    fields = [
        "user",
        "role",
        "assigned_by",
        "joined_at",
        "updated_at",
    ]

    readonly_fields = [
        "joined_at",
        "updated_at",
    ]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "code",
        "organization",
        "owner",
        "status",
        "priority",
        "due_date",
        "is_archived",
        "created_at",
    ]

    list_filter = [
        "status",
        "priority",
        "is_archived",
        "organization",
        "created_at",
    ]

    search_fields = [
        "name",
        "code",
        "description",
        "organization__name",
        "owner__username",
        "owner__email",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    autocomplete_fields = [
        "organization",
        "owner",
    ]

    inlines = [ProjectMemberInline]

    list_per_page = 25

    ordering = ["-created_at"]

    date_hierarchy = "created_at"


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = [
        "project",
        "user",
        "role",
        "assigned_by",
        "joined_at",
    ]

    list_filter = [
        "role",
        "joined_at",
    ]

    search_fields = [
        "project__name",
        "project__code",
        "user__username",
        "user__email",
        "assigned_by__username",
    ]

    autocomplete_fields = [
        "project",
        "user",
        "assigned_by",
    ]

    readonly_fields = [
        "joined_at",
        "updated_at",
    ]

    list_per_page = 25

    ordering = ["-joined_at"]