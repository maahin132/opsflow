from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.comments.models import TaskActivity
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task
from .models import Organization, OrganizationMember


class OrganizationAPITests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="StrongPass123!",
        )

        self.member = User.objects.create_user(
            username="member",
            email="member@example.com",
            password="StrongPass123!",
        )

        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider@example.com",
            password="StrongPass123!",
        )

        self.organization = Organization.objects.create(
            name="Owner Organization",
            slug="owner-organization",
            description="Test organization",
            owner=self.owner,
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.owner,
            role=OrganizationMember.Role.OWNER,
        )

        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.member,
            role=OrganizationMember.Role.MEMBER,
        )

        self.list_url = reverse("organization-list")
        self.detail_url = reverse(
            "organization-detail",
            kwargs={"pk": self.organization.pk},
        )

    def test_authenticated_user_can_create_organization(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.post(
            self.list_url,
            {
                "name": "New Organization",
                "slug": "new-organization",
                "description": "Created through API",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        organization = Organization.objects.get(
            slug="new-organization"
        )

        self.assertEqual(organization.owner, self.outsider)

        membership_exists = OrganizationMember.objects.filter(
            organization=organization,
            user=self.outsider,
            role=OrganizationMember.Role.OWNER,
        ).exists()

        self.assertTrue(membership_exists)

    def test_owner_can_view_organization(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["name"],
            self.organization.name,
        )

    def test_member_can_view_organization(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["current_user_role"], "MEMBER")
        self.assertEqual(len(response.data["members"]), 2)
        self.assertEqual(
            {member["user_id"] for member in response.data["members"]},
            {self.owner.id, self.member.id},
        )

    def test_outsider_cannot_view_organization(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_update_organization(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            self.detail_url,
            {
                "description": "Updated by owner",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.organization.refresh_from_db()

        self.assertEqual(
            self.organization.description,
            "Updated by owner",
        )

    def test_member_cannot_update_organization(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            self.detail_url,
            {
                "description": "Unauthorized update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_outsider_cannot_update_organization(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.patch(
            self.detail_url,
            {
                "description": "Unauthorized update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_owner_can_delete_organization(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(self.detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            Organization.objects.filter(
                pk=self.organization.pk
            ).exists()
        )

    def test_member_cannot_delete_organization(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.delete(self.detail_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertTrue(
            Organization.objects.filter(
                pk=self.organization.pk
            ).exists()
        )

    def test_user_only_sees_organizations_they_belong_to(self):
        other_organization = Organization.objects.create(
            name="Private Organization",
            slug="private-organization",
            owner=self.outsider,
        )

        OrganizationMember.objects.create(
            organization=other_organization,
            user=self.outsider,
            role=OrganizationMember.Role.OWNER,
        )

        self.client.force_authenticate(user=self.member)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        organization_ids = [
            item["id"]
            for item in response.data["results"]
        ]

        self.assertIn(self.organization.id, organization_ids)
        self.assertNotIn(other_organization.id, organization_ids)

    def test_owner_can_add_registered_user_by_email(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.detail_url}members/",
            {"email": self.outsider.email, "role": "MANAGER"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user_id"], self.outsider.id)
        self.assertEqual(response.data["role"], "MANAGER")
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=self.organization,
                user=self.outsider,
                role="MANAGER",
            ).exists()
        )

    def test_owner_cannot_add_duplicate_member(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.detail_url}members/",
            {"email": self.member.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_owner_cannot_add_unknown_or_invalid_users(self):
        self.client.force_authenticate(user=self.owner)

        unknown_user_response = self.client.post(
            f"{self.detail_url}members/",
            {"email": "missing@example.com"},
            format="json",
        )
        invalid_input_response = self.client.post(
            f"{self.detail_url}members/",
            {"email": None, "role": []},
            format="json",
        )

        self.assertEqual(unknown_user_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(invalid_input_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_grant_admin_role(self):
        admin = User.objects.create_user(
            username="organization_admin",
            email="admin@example.com",
            password="StrongPass123!",
        )
        OrganizationMember.objects.create(
            organization=self.organization,
            user=admin,
            role=OrganizationMember.Role.ADMIN,
        )
        self.client.force_authenticate(user=admin)

        response = self.client.post(
            f"{self.detail_url}members/",
            {"email": self.outsider.email, "role": "ADMIN"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update_and_remove_workspace_member(self):
        self.client.force_authenticate(user=self.owner)
        member_url = f"{self.detail_url}members/{self.member.id}/"

        update_response = self.client.patch(
            member_url,
            {"role": "MANAGER"},
            format="json",
        )
        delete_response = self.client.delete(member_url)

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["role"], "MANAGER")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            OrganizationMember.objects.filter(
                organization=self.organization,
                user=self.member,
            ).exists()
        )

    def test_workspace_member_cannot_manage_members(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            f"{self.detail_url}members/",
            {"email": self.outsider.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_membership_cannot_be_changed_or_removed(self):
        self.client.force_authenticate(user=self.owner)
        owner_url = f"{self.detail_url}members/{self.owner.id}/"

        update_response = self.client.patch(
            owner_url,
            {"role": "MEMBER"},
            format="json",
        )
        delete_response = self.client.delete(owner_url)

        self.assertEqual(update_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=self.organization,
                user=self.owner,
                role="OWNER",
            ).exists()
        )

    def test_member_detail_rejects_malformed_user_id(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(
            f"{self.detail_url}members/not-an-id/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_workspace_removal_cleans_project_access_and_task_assignment(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Member Project",
            owner=self.owner,
        )
        ProjectMember.objects.create(
            project=project,
            user=self.member,
            assigned_by=self.owner,
        )
        task = Task.objects.create(
            project=project,
            title="Assigned task",
            assigned_to=self.member,
            created_by=self.owner,
        )
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(
            f"{self.detail_url}members/{self.member.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ProjectMember.objects.filter(project=project, user=self.member).exists()
        )
        task.refresh_from_db()
        self.assertIsNone(task.assigned_to_id)
        self.assertTrue(
            TaskActivity.objects.filter(
                task=task,
                actor=self.owner,
                action="unassigned",
            ).exists()
        )