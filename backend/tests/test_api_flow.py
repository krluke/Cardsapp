import json
from django.test import TestCase, Client
from django.db import connection
from werkzeug.security import generate_password_hash


class ApiFlowTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.test_email = "test@example.com"
        self.test_username = "testuser"
        self.raw_password = "secret123"
        self.hashed = generate_password_hash(self.raw_password)
        # Ensure required tables exist and insert test data
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
                (self.test_email, self.test_username, self.hashed),
            )
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS folders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255),
                title VARCHAR(255),
                visibility VARCHAR(20)
            )""")
            c.execute(
                "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
                (self.test_email, "Test Folder", "private"),
            )
            self.folder_id = c.lastrowid
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folder_id INT,
                order_index INT,
                front_content LONGTEXT,
                back_content LONGTEXT,
                front_bg VARCHAR(255),
                back_bg VARCHAR(255)
            )""")

    def test_login_and_card_flow(self):
        # Login
        resp = self.client.post(
            "/api/login",
            json.dumps({"id": self.test_email, "password": self.raw_password}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        # Save a card
        save_resp = self.client.post(
            "/api/cards/save",
            json.dumps(
                {
                    "folderId": self.folder_id,
                    "userEmail": self.test_email,
                    "cards": [
                        {
                            "front": "<p>Hello</p>",
                            "back": "<p>World</p>",
                            "frontBg": "",
                            "backBg": "",
                        }
                    ],
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(save_resp.status_code, 200)
        # Load cards
        load_resp = self.client.get(
            f"/api/cards/load/{self.folder_id}?userEmail={self.test_email}"
        )
        self.assertEqual(load_resp.status_code, 200)
        data = load_resp.json()
        self.assertTrue(isinstance(data, list))
        self.assertEqual(len(data), 1)
        self.assertIn("Hello", data[0]["front"])
