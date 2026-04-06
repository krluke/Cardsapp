import json
from django.test import TestCase, Client
from django.db import connection
from werkzeug.security import generate_password_hash


class AuthFlowTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.email = "authuser@example.com"
        self.username = "authuser"
        self.password = "SecretPwd1!"
        self.hashed = generate_password_hash(self.password)
        # Insert user directly
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
                (self.email, self.username, self.hashed),
            )
        # Insert verification code for signup flow (not used here but required by endpoint logic)
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS verification_codes (
                email VARCHAR(255) PRIMARY KEY,
                code VARCHAR(10)
            )""")
            c.execute(
                "REPLACE INTO verification_codes (email, code) VALUES (%s, %s)",
                (self.email, "123456"),
            )

    def test_successful_login(self):
        resp = self.client.post(
            "/api/login",
            json.dumps({"id": self.email, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("csrfToken", data)
        self.assertEqual(data.get("email"), self.email)

    def test_failed_login_wrong_password(self):
        resp = self.client.post(
            "/api/login",
            json.dumps({"id": self.email, "password": "wrong"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_change_password(self):
        # First login to get CSRF token (not needed for API as we bypass CSRF in view, but we simulate flow)
        # Directly call change_password endpoint
        new_pass = "NewSecret1!"
        resp = self.client.post(
            "/api/user/change-password",
            json.dumps(
                {
                    "userEmail": self.email,
                    "currentPassword": self.password,
                    "newPassword": new_pass,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        # Verify login with new password works
        resp2 = self.client.post(
            "/api/login",
            json.dumps({"id": self.email, "password": new_pass}),
            content_type="application/json",
        )
        self.assertEqual(resp2.status_code, 200)
