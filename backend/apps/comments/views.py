from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tasks.models import Task
from apps.organizations.models import OrganizationMember

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
        comment = serializer.save(
            task=self.get_task(),
            author=self.request.user,
        )
        TaskActivity.objects.create(
            task=comment.task,
            actor=self.request.user,
            action="commented",
            description="Added a comment",
            metadata={"comment_id": comment.id},
        )


class TaskCommentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_comment(self, request, task_id, comment_id):
        try:
            return TaskComment.objects.select_related(
                "author",
                "task",
                "task__project",
                "task__project__organization",
            ).get(
                id=comment_id,
                task_id=task_id,
                task__project__organization__members__user=request.user,
                task__project__organization__is_active=True,
            )
        except TaskComment.DoesNotExist:
            raise NotFound("Comment not found.")

    @staticmethod
    def can_manage_task(request, task):
        return OrganizationMember.objects.filter(
            organization=task.project.organization,
            user=request.user,
            role__in=[
                OrganizationMember.Role.OWNER,
                OrganizationMember.Role.ADMIN,
                OrganizationMember.Role.MANAGER,
            ],
        ).exists()

    def patch(self, request, task_id, comment_id):
        comment = self.get_comment(request, task_id, comment_id)
        if comment.author_id != request.user.id and not self.can_manage_task(request, comment.task):
            return Response(
                {"detail": "Only the comment author or a workspace manager can edit this comment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskCommentSerializer(
            comment,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        updated_comment = serializer.save()
        TaskActivity.objects.create(
            task=comment.task,
            actor=request.user,
            action="comment_edited",
            description="Edited a task comment",
            metadata={"comment_id": comment.id},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, task_id, comment_id):
        comment = self.get_comment(request, task_id, comment_id)
        if comment.author_id != request.user.id and not self.can_manage_task(request, comment.task):
            return Response(
                {"detail": "Only the comment author or a workspace manager can delete this comment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        TaskActivity.objects.create(
            task=comment.task,
            actor=request.user,
            action="comment_deleted",
            description="Deleted a task comment",
            metadata={"comment_id": comment.id},
        )
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class WorkspaceActivityView(generics.ListAPIView):
    serializer_class = TaskActivitySerializer

    def get_queryset(self):
        return TaskActivity.objects.filter(
            task__project__organization__members__user=self.request.user,
            task__project__organization__is_active=True,
        ).select_related(
            "actor",
            "task",
            "task__project",
        ).distinct()