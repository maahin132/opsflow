from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, ProjectMember


User = get_user_model()


class ProjectAPITests(APITestCase):

    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            username="project_owner",
            email="owner@example.com",
            password="StrongPass123!"
        )

        self.manager = User.objects.create_user(
            username="project_manager",
            email="manager@example.com",
            password="StrongPass123!"
        )

        self.employee = User.objects.create_user(
            username="project_employee",
            email="employee@example.com",
            password="StrongPass123!"
        )

        self.outsider = User.objects.create_user(
            username="project_outsider",
            email="outsider@example.com",
            password="StrongPass123!"
        )

        # Create organization
        self.organization = Organization.objects.create(
            name="OpsFlow Test Organization",
            slug="opsflow-test-organization",
            description="Organization for project tests",
            owner=self.owner
        )

        # Organization memberships
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.owner,
            role=OrganizationMember.Role.OWNER
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.manager,
            role=OrganizationMember.Role.MANAGER
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.employee,
            role=OrganizationMember.Role.EMPLOYEE
        )

        # Create another organization for isolation tests
        self.other_organization = Organization.objects.create(
            name="Other Organization",
            slug="other-test-organization",
            description="Another organization",
            owner=self.outsider
        )

        OrganizationMember.objects.create(
            organization=self.other_organization,
            user=self.outsider,
            role=OrganizationMember.Role.OWNER
        )

        # Create a project
        self.project = Project.objects.create(
            organization=self.organization,
            name="Website Development",
            description="Develop the OpsFlow website",
            code="OPS-001",
            status=Project.Status.ACTIVE,
            priority=Project.Priority.HIGH,
            owner=self.owner
        )

        # API URLs
        self.project_list_url = reverse("project-list")

        self.project_detail_url = reverse(
            "project-detail",
            kwargs={"pk": self.project.pk}
        )

    # --------------------------------------------------
    # PROJECT CREATION
    # --------------------------------------------------

    def test_owner_can_create_project(self):
        self.client.force_authenticate(user=self.owner)

        data = {
            "organization_id": self.organization.id,
            "name": "New Backend Project",
            "description": "Build the backend API",
            "code": "OPS-002",
            "status": "PLANNING",
            "priority": "HIGH",
            "start_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=30))
        }

        response = self.client.post(
            self.project_list_url,
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            Project.objects.filter(
                name="New Backend Project",
                organization=self.organization
            ).exists()
        )

    def test_manager_can_create_project(self):
        self.client.force_authenticate(user=self.manager)

        data = {
            "organization_id": self.organization.id,
            "name": "Manager Created Project",
            "description": "Created by manager",
            "code": "OPS-003",
            "status": "PLANNING",
            "priority": "MEDIUM"
        }

        response = self.client.post(
            self.project_list_url,
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_employee_cannot_create_project(self):
        self.client.force_authenticate(user=self.employee)

        data = {
            "organization_id": self.organization.id,
            "name": "Unauthorized Project",
            "description": "Should not be created",
            "code": "OPS-004",
            "status": "PLANNING",
            "priority": "LOW"
        }

        response = self.client.post(
            self.project_list_url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_outsider_cannot_create_project_in_other_organization(self):
        self.client.force_authenticate(user=self.owner)

        data = {
            "organization_id": self.other_organization.id,
            "name": "Unauthorized Organization Project",
            "description": "Should not be created",
            "code": "OPS-005",
            "status": "PLANNING",
            "priority": "LOW"
        }

        response = self.client.post(
            self.project_list_url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------
    # PROJECT LIST AND TENANT ISOLATION
    # --------------------------------------------------

    def test_organization_member_can_view_projects(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.get(self.project_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data["results"]), 1)

        self.assertEqual(
            response.data["results"][0]["name"],
            "Website Development"
        )

    def test_outsider_cannot_view_other_organization_projects(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(self.project_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data["results"]), 0)

    def test_member_cannot_access_project_from_other_organization(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(self.project_detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_organization_filter_returns_correct_projects(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            self.project_list_url,
            {"organization": self.organization.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data["results"]), 1)

    # --------------------------------------------------
    # PROJECT UPDATE AND DELETE PERMISSIONS
    # --------------------------------------------------

    def test_manager_can_update_project(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            self.project_detail_url,
            {"name": "Updated Website Project"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.project.refresh_from_db()

        self.assertEqual(
            self.project.name,
            "Updated Website Project"
        )

    def test_employee_cannot_update_project(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.patch(
            self.project_detail_url,
            {"name": "Unauthorized Update"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_manager_can_delete_project(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.delete(self.project_detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertFalse(
            Project.objects.filter(pk=self.project.pk).exists()
        )

    def test_employee_cannot_delete_project(self):
        self.client.force_authenticate(user=self.employee)

        response = self.client.delete(self.project_detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------
    # PROJECT MEMBERS
    # --------------------------------------------------

    def test_manager_can_add_organization_member_to_project(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            reverse(
                "project-add-member",
                kwargs={"pk": self.project.pk}
            ),
            {
                "user": self.employee.id,
                "role": "MEMBER"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.employee
            ).exists()
        )

    def test_cannot_add_user_from_another_organization(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            reverse(
                "project-add-member",
                kwargs={"pk": self.project.pk}
            ),
            {
                "user": self.outsider.id,
                "role": "MEMBER"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_manager_can_remove_project_member(self):
        self.client.force_authenticate(user=self.manager)

        membership = ProjectMember.objects.create(
            project=self.project,
            user=self.employee,
            role=ProjectMember.Role.MEMBER,
            assigned_by=self.manager
        )

        response = self.client.delete(
            reverse(
                "project-remove-member",
                kwargs={
                    "pk": self.project.pk,
                    "user_id": self.employee.id
                }
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertFalse(
            ProjectMember.objects.filter(
                pk=membership.pk
            ).exists()
        )

    # --------------------------------------------------
    # VALIDATION
    # --------------------------------------------------

    def test_due_date_cannot_be_before_start_date(self):
        self.client.force_authenticate(user=self.owner)

        start_date = date.today()
        due_date = start_date - timedelta(days=1)

        data = {
            "organization_id": self.organization.id,
            "name": "Invalid Date Project",
            "description": "Testing date validation",
            "code": "OPS-006",
            "status": "PLANNING",
            "priority": "MEDIUM",
            "start_date": str(start_date),
            "due_date": str(due_date)
        }

        response = self.client.post(
            self.project_list_url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn("due_date", response.data)

    def test_unauthenticated_user_cannot_view_projects(self):
        response = self.client.get(self.project_list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )