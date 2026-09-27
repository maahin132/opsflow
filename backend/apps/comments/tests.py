from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project
from apps.tasks.models import Task

from .models import TaskActivity, TaskComment


class TaskCommentsAPITest(APITestCase):

    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username="commentuser",
            email="commentuser@example.com",
            password="TestPassword123!",
        )

        # Create organization
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-organization",
            owner=self.user,
        )

        # Add user as organization owner
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.user,
            role="OWNER",
        )

        # Create project
        self.project = Project.objects.create(
            organization=self.organization,
            name="Test Project",
            description="Testing comments",
            owner=self.user,
        )

        # Create task
        self.task = Task.objects.create(
            project=self.project,
            title="Test Task",
            description="Testing task comments",
            created_by=self.user,
        )

        # Authenticate user
        self.client.force_authenticate(user=self.user)

        # API URLs
        self.comments_url = reverse(
            "task-comments",
            kwargs={"task_id": self.task.id},
        )

        self.activities_url = reverse(
            "task-activities",
            kwargs={"task_id": self.task.id},
        )

    def test_create_task_comment(self):
        response = self.client.post(
            self.comments_url,
            {"content": "This is a test comment"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            TaskComment.objects.count(),
            1,
        )

        comment = TaskComment.objects.first()

        self.assertEqual(comment.author, self.user)
        self.assertEqual(
            comment.content,
            "This is a test comment",
        )

    def test_list_task_comments(self):
        TaskComment.objects.create(
            task=self.task,
            author=self.user,
            content="Existing comment",
        )

        response = self.client.get(self.comments_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_list_task_activities(self):
        TaskActivity.objects.create(
            task=self.task,
            actor=self.user,
            action="created",
            description="Task created",
        )

        response = self.client.get(self.activities_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_other_organization_cannot_access_task(self):
        other_user = User.objects.create_user(
            username="outsider",
            email="outsider@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(user=other_user)

        response = self.client.get(self.comments_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )