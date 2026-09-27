from rest_framework import serializers

from .models import TaskActivity, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    class Meta:
        model = TaskComment
        fields = [
            "id",
            "task",
            "author",
            "author_name",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "task",
            "author",
            "author_name",
            "created_at",
            "updated_at",
        ]


class TaskActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(
        source="actor.username",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = TaskActivity
        fields = [
            "id",
            "task",
            "actor",
            "actor_name",
            "action",
            "description",
            "metadata",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "task",
            "actor",
            "actor_name",
            "action",
            "description",
            "metadata",
            "created_at",
        ]