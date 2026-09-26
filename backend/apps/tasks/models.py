from django.conf import settings
from django.db import models
from django.utils import timezone


class Task(models.Model):

    # Task Status
    class Status(models.TextChoices):
        TODO = "TODO", "To Do"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        IN_REVIEW = "IN_REVIEW", "In Review"
        DONE = "DONE", "Done"
        BLOCKED = "BLOCKED", "Blocked"

    # Task Priority
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    # Task belongs to a project
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )

    # Task Details
    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    # Optional task code
    code = models.CharField(
        max_length=30,
        blank=True,
    )

    # Task Status and Priority
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
        db_index=True,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
    )

    # Task Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_tasks",
    )

    # Task Dates
    start_date = models.DateField(
        null=True,
        blank=True,
    )

    due_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Archive
    is_archived = models.BooleanField(
        default=False,
        db_index=True,
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["project", "status"],
                name="task_project_status_idx",
            ),
            models.Index(
                fields=["project", "priority"],
                name="task_project_priority_idx",
            ),
            models.Index(
                fields=["assigned_to", "status"],
                name="task_assignee_status_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} ({self.project.name})"

    def save(self, *args, **kwargs):
        if self.status == self.Status.DONE:
            if not self.completed_at:
                self.completed_at = timezone.now()
        else:
            self.completed_at = None

        super().save(*args, **kwargs)