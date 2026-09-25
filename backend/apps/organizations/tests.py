from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
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