from rest_framework import generics
from rest_framework.exceptions import NotFound

from apps.tasks.models import Task

from .models import TaskActivity, TaskComment
from .serializers import (
    TaskActivitySerializer,
    TaskCommentSerializer,
)


class TaskCommentsView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer

    def get_task(self):
        if not hasattr(self, "_task"):
            try:
                self._task = Task.objects.get(
                    id=self.kwargs["task_id"],
                    project__organization__members__user=self.request.user,
                    project__organization__is_active=True,
                )
            except Task.DoesNotExist:
                raise NotFound("Task not found.")

        return self._task

    def get_queryset(self):
        task = self.get_task()

        return TaskComment.objects.filter(
            task=task
        ).select_related("author")

    def perform_create(self, serializer):
        serializer.save(
            task=self.get_task(),
            author=self.request.user,
        )


class TaskActivityView(generics.ListAPIView):
    serializer_class = TaskActivitySerializer

    def get_queryset(self):
        try:
            task = Task.objects.get(
                id=self.kwargs["task_id"],
                project__organization__members__user=self.request.user,
                project__organization__is_active=True,
            )
        except Task.DoesNotExist:
            raise NotFound("Task not found.")

        return TaskActivity.objects.filter(
            task=task
        ).select_related("actor")