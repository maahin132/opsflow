from django.urls import path

from .views import TaskActivityView, TaskCommentsView


urlpatterns = [
    path(
        "tasks/<int:task_id>/comments/",
        TaskCommentsView.as_view(),
        name="task-comments",
    ),
    path(
        "tasks/<int:task_id>/activities/",
        TaskActivityView.as_view(),
        name="task-activities",
    ),
]