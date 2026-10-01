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
        self.workspace_activity_url = reverse("workspace-activity")

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

    def test_comment_author_can_edit_comment(self):
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.user,
            content="Original text",
        )

        response = self.client.patch(
            f"{self.comments_url}{comment.id}/",
            {"content": "Updated text"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["content"], "Updated text")
        self.assertTrue(
            TaskActivity.objects.filter(
                task=self.task,
                actor=self.user,
                action="comment_edited",
            ).exists()
        )

    def test_comment_author_can_delete_comment(self):
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.user,
            content="Remove this text",
        )

        response = self.client.delete(f"{self.comments_url}{comment.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())
        self.assertTrue(
            TaskActivity.objects.filter(
                task=self.task,
                actor=self.user,
                action="comment_deleted",
            ).exists()
        )

    def test_workspace_manager_can_moderate_another_members_comment(self):
        member = User.objects.create_user(
            username="commentmember",
            email="commentmember@example.com",
            password="TestPassword123!",
        )
        OrganizationMember.objects.create(
            organization=self.organization,
            user=member,
            role=OrganizationMember.Role.MEMBER,
        )
        comment = TaskComment.objects.create(
            task=self.task,
            author=member,
            content="Needs moderation",
        )

        response = self.client.delete(f"{self.comments_url}{comment.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())

    def test_other_organization_cannot_access_comment(self):
        other_user = User.objects.create_user(
            username="commentoutsider",
            email="commentoutsider@example.com",
            password="TestPassword123!",
        )
        comment = TaskComment.objects.create(
            task=self.task,
            author=self.user,
            content="Private comment",
        )
        self.client.force_authenticate(user=other_user)

        response = self.client.patch(
            f"{self.comments_url}{comment.id}/",
            {"content": "Unauthorized edit"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

    def test_workspace_activity_includes_task_context(self):
        self.client.post(
            self.comments_url,
            {"content": "A workspace-visible update"},
            format="json",
        )

        response = self.client.get(self.workspace_activity_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["task_title"], "Test Task")
        self.assertEqual(
            response.data["results"][0]["project_name"],
            "Test Project",
        )

    def test_workspace_activity_does_not_expose_other_organizations(self):
        other_user = User.objects.create_user(
            username="activityoutsider",
            email="activityoutsider@example.com",
            password="TestPassword123!",
        )
        self.client.force_authenticate(user=other_user)

        response = self.client.get(self.workspace_activity_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

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