from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, ProjectMember

from .models import Task

User = get_user_model()


class TaskAPITests(APITestCase):

    def setUp(self):
        # --------------------------------------------------
        # USERS
        # --------------------------------------------------

        self.owner = User.objects.create_user(
            username="task_owner",
            email="taskowner@example.com",
            password="StrongPass123!",
        )

        self.manager = User.objects.create_user(
            username="task_manager",
            email="taskmanager@example.com",
            password="StrongPass123!",
        )

        self.employee = User.objects.create_user(
            username="task_employee",
            email="taskemployee@example.com",
            password="StrongPass123!",
        )

        self.outsider = User.objects.create_user(
            username="task_outsider",
            email="taskoutsider@example.com",
            password="StrongPass123!",
        )

        # --------------------------------------------------
        # ORGANIZATION
        # --------------------------------------------------

        self.organization = Organization.objects.create(
            name="Task Test Organization",
            slug="task-test-organization",
            description="Organization for task tests",
            owner=self.owner,
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.owner,
            role=OrganizationMember.Role.OWNER,
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.manager,
            role=OrganizationMember.Role.MANAGER,
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.employee,
            role=OrganizationMember.Role.EMPLOYEE,
        )

        # --------------------------------------------------
        # PROJECT
        # --------------------------------------------------

        self.project = Project.objects.create(
            organization=self.organization,
            name="Task Test Project",
            description="Project for task testing",
            code="TASK-001",
            status=Project.Status.ACTIVE,
            priority=Project.Priority.HIGH,
            owner=self.owner,
        )

        # Project membership is required for task assignment
        ProjectMember.objects.create(
            project=self.project,
            user=self.manager,
            role=ProjectMember.Role.MANAGER,
            assigned_by=self.owner,
        )

        ProjectMember.objects.create(
            project=self.project,
            user=self.employee,
            role=ProjectMember.Role.MEMBER,
            assigned_by=self.owner,
        )

        # --------------------------------------------------
        # TASK
        # --------------------------------------------------

        self.task = Task.objects.create(
            project=self.project,
            title="Build Authentication API",
            description="Implement authentication endpoints",
            code="TASK-001",
            status=Task.Status.TODO,
            priority=Task.Priority.HIGH,
            assigned_to=self.employee,
            created_by=self.owner,
            start_date=date.today(),
            due_date=date.today() + timedelta(days=7),
        )

        # --------------------------------------------------
        # URL
        # --------------------------------------------------

        self.task_list_url = reverse("task-list")

        self.task_detail_url = reverse(
            "task-detail",
            kwargs={"pk": self.task.pk},
        )

    # ======================================================
    # TASK LIST
    # ======================================================

    def test_authenticated_user_can_view_tasks(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(self.task_list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

        self.assertEqual(
            response.data["results"][0]["title"],
            "Build Authentication API",
        )

    def test_unauthenticated_user_cannot_view_tasks(self):
        response = self.client.get(self.task_list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ======================================================
    # TASK CREATION
    # ======================================================

    def test_owner_can_create_task(self):
        self.client.force_authenticate(user=self.owner)

        data = {
            "project_id": self.project.id,
            "title": "Create Dashboard",
            "description": "Build project dashboard",
            "code": "TASK-002",
            "status": "TODO",
            "priority": "MEDIUM",
            "assigned_to": self.employee.id,
            "start_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=10)),
        }

        response = self.client.post(
            self.task_list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Task.objects.filter(
                title="Create Dashboard",
                project=self.project,
            ).exists()
        )

    def test_manager_can_create_task(self):
        self.client.force_authenticate(user=self.manager)

        data = {
            "project_id": self.project.id,
            "title": "Create Reports",
            "description": "Build reporting module",
            "code": "TASK-003",
            "status": "TODO",
            "priority": "MEDIUM",
        }

        response = self.client.post(
            self.task_list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_employee_cannot_create_task(self):
        self.client.force_authenticate(user=self.employee)

        data = {
            "project_id": self.project.id,
            "title": "Unauthorized Task",
            "description": "This should not be created",
            "code": "TASK-004",
            "status": "TODO",
            "priority": "LOW",
        }

        response = self.client.post(
            self.task_list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ======================================================
    # TASK UPDATE
    # ======================================================

    def test_manager_can_update_task(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            self.task_detail_url,
            {
                "title": "Updated Authentication Task",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.title,
            "Updated Authentication Task",
        )

    def test_employee_cannot_update_task(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.patch(
            self.task_detail_url,
            {
                "title": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ======================================================
    # TASK DELETE
    # ======================================================

    def test_manager_can_delete_task(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.delete(
            self.task_detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Task.objects.filter(
                pk=self.task.pk,
            ).exists()
        )

    def test_employee_cannot_delete_task(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.delete(
            self.task_detail_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # ======================================================
    # TASK ASSIGNMENT
    # ======================================================

    def test_manager_can_assign_task(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            reverse(
                "task-assign",
                kwargs={"pk": self.task.pk},
            ),
            {
                "user": self.manager.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.assigned_to_id,
            self.manager.id,
        )

    def test_cannot_assign_task_to_non_project_member(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            reverse(
                "task-assign",
                kwargs={"pk": self.task.pk},
            ),
            {
                "user": self.outsider.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # ======================================================
    # TASK STATUS
    # ======================================================

    def test_assignee_can_update_task_status(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            reverse(
                "task-update-status",
                kwargs={"pk": self.task.pk},
            ),
            {
                "status": "IN_PROGRESS",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.IN_PROGRESS,
        )

    def test_assignee_can_mark_task_done(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.post(
            reverse(
                "task-update-status",
                kwargs={"pk": self.task.pk},
            ),
            {
                "status": "DONE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.task.refresh_from_db()

        self.assertEqual(
            self.task.status,
            Task.Status.DONE,
        )

        self.assertIsNotNone(
            self.task.completed_at
        )

    def test_invalid_task_status_is_rejected(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            reverse(
                "task-update-status",
                kwargs={"pk": self.task.pk},
            ),
            {
                "status": "INVALID_STATUS",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_unassigned_user_cannot_update_task_status(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.post(
            reverse(
                "task-update-status",
                kwargs={"pk": self.task.pk},
            ),
            {
                "status": "DONE",
            },
            format="json",
        )

        # Outsiders are excluded by the tenant-scoped queryset,
        # so the API correctly returns 404 instead of exposing the task.
        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # ======================================================
    # VALIDATION
    # ======================================================

    def test_due_date_cannot_be_before_start_date(self):
        self.client.force_authenticate(user=self.owner)

        start_date = date.today()
        due_date = start_date - timedelta(days=1)

        data = {
            "project_id": self.project.id,
            "title": "Invalid Date Task",
            "description": "Testing date validation",
            "code": "TASK-005",
            "status": "TODO",
            "priority": "MEDIUM",
            "start_date": str(start_date),
            "due_date": str(due_date),
        }

        response = self.client.post(
            self.task_list_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "due_date",
            response.data,
        )

    # ======================================================
    # FILTERS
    # ======================================================

    def test_filter_tasks_by_status(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            self.task_list_url,
            {
                "status": "TODO",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_filter_tasks_by_priority(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            self.task_list_url,
            {
                "priority": "HIGH",
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_filter_tasks_by_project(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            self.task_list_url,
            {
                "project": self.project.id,
            },
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )