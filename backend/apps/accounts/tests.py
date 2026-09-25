from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthenticationAPITests(APITestCase):

    def setUp(self):
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-me")

        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }

    def test_user_registration(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(email="testuser@example.com").exists()
        )

    def test_user_cannot_register_with_duplicate_email(self):
        User.objects.create_user(
            username="existinguser",
            email="testuser@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_confirmation_is_required(self):
        data = self.user_data.copy()
        data["password_confirm"] = "WrongPassword123!"

        response = self.client.post(
            self.register_url,
            data,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_email(self):
        user = User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            self.login_url,
            {
                "identifier": "login@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], user.email)

    def test_login_with_username(self):
        user = User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            self.login_url,
            {
                "identifier": "loginuser",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["username"], user.username)

    def test_login_with_invalid_password(self):
        User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            self.login_url,
            {
                "identifier": "loginuser",
                "password": "WrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authenticated_user_can_access_me(self):
        user = User.objects.create_user(
            username="meuser",
            email="me@example.com",
            password="StrongPass123!",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], user.email)

    def test_unauthenticated_user_cannot_access_me(self):
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_logout(self):
        user = User.objects.create_user(
            username="logoutuser",
            email="logout@example.com",
            password="StrongPass123!",
        )

        self.client.force_authenticate(user=user)

        response = self.client.post(self.logout_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)