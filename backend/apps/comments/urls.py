from django.urls import path

from .views import (
    TaskActivityView,
    TaskCommentDetailView,
    TaskCommentsView,
    WorkspaceActivityView,
)


urlpatterns = [
    path(
        "activity/",
        WorkspaceActivityView.as_view(),
        name="workspace-activity",
    ),
    path(
        "tasks/<int:task_id>/comments/",
        TaskCommentsView.as_view(),
        name="task-comments",
    ),
    path(
        "tasks/<int:task_id>/comments/<int:comment_id>/",
        TaskCommentDetailView.as_view(),
        name="task-comment-detail",
    ),
    path(
        "tasks/<int:task_id>/activities/",
        TaskActivityView.as_view(),
        name="task-activities",
    ),
]