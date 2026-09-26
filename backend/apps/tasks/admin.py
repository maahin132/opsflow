from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):

    # --------------------------------------------------
    # LIST DISPLAY
    # --------------------------------------------------

    list_display = (
        "id",
        "title",
        "project",
        "status",
        "priority",
        "assigned_to",
        "created_by",
        "due_date",
        "is_archived",
        "created_at",
    )

    # --------------------------------------------------
    # FILTERS
    # --------------------------------------------------

    list_filter = (
        "status",
        "priority",
        "is_archived",
        "created_at",
        "due_date",
    )

    # --------------------------------------------------
    # SEARCH
    # --------------------------------------------------

    search_fields = (
        "title",
        "description",
        "code",
        "project__name",
        "assigned_to__email",
        "created_by__email",
    )

    # --------------------------------------------------
    # DETAILS
    # --------------------------------------------------

    readonly_fields = (
        "completed_at",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Task Information",
            {
                "fields": (
                    "project",
                    "title",
                    "description",
                    "code",
                ),
            },
        ),
        (
            "Status & Priority",
            {
                "fields": (
                    "status",
                    "priority",
                    "is_archived",
                ),
            },
        ),
        (
            "Assignment",
            {
                "fields": (
                    "assigned_to",
                    "created_by",
                ),
            },
        ),
        (
            "Schedule",
            {
                "fields": (
                    "start_date",
                    "due_date",
                    "completed_at",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    # --------------------------------------------------
    # PAGINATION & SORTING
    # --------------------------------------------------

    list_per_page = 25
    list_select_related = (
        "project",
        "assigned_to",
        "created_by",
    )

    ordering = ("-created_at",)