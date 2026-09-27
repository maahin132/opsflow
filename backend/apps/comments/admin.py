from django.contrib import admin

from .models import TaskActivity, TaskComment


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "task",
        "author",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "content",
        "author__username",
        "task__title",
    )

    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "task",
        "actor",
        "action",
        "created_at",
    )

    search_fields = (
        "action",
        "description",
        "task__title",
        "actor__username",
    )

    list_filter = ("action", "created_at")

    readonly_fields = ("created_at",)