import json
from django.test import TestCase, Client
from django.db import connection
from werkzeug.security import generate_password_hash


class CardFlowTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.email = "carduser@example.com"
        self.username = "carduser"
        self.password = "CardPwd1!"
        self.hashed = generate_password_hash(self.password)
        # Users table
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS users (
                email VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255),
                password VARCHAR(255)
            )""")
            c.execute(
                "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
                (self.email, self.username, self.hashed),
            )
        # Folders table
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS folders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255),
                title VARCHAR(255),
                visibility VARCHAR(20)
            )""")
            c.execute(
                "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
                (self.email, "Card Folder", "private"),
            )
            self.folder_id = c.lastrowid
        # Cards table
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
        # Ensure like/favorite tables exist for toggle actions
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS folder_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folder_id INT,
                user_email VARCHAR(255)
            )""")
            c.execute("""CREATE TABLE IF NOT EXISTS folder_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folder_id INT,
                user_email VARCHAR(255)
            )""")

    def test_save_and_load_cards(self):
        # Save a card via API
        save_resp = self.client.post(
            "/api/cards/save",
            json.dumps(
                {
                    "folderId": self.folder_id,
                    "userEmail": self.email,
                    "cards": [
                        {
                            "front": "<p>Front Content</p>",
                            "back": "<p>Back Content</p>",
                            "frontBg": "#fff",
                            "backBg": "#eee",
                        }
                    ],
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(save_resp.status_code, 200)
        # Load cards
        load_resp = self.client.get(
            f"/api/cards/load/{self.folder_id}?userEmail={self.email}"
        )
        self.assertEqual(load_resp.status_code, 200)
        data = load_resp.json()
        self.assertEqual(len(data), 1)
        self.assertIn("Front Content", data[0]["front"])
        self.assertIn("Back Content", data[0]["back"])
        self.card_id = data[0].get("id")

    def test_delete_card(self):
        # First save a card
        self.test_save_and_load_cards()
        # Retrieve card ID from DB directly
        with connection.cursor() as c:
            c.execute("SELECT id FROM cards WHERE folder_id = %s", (self.folder_id,))
            row = c.fetchone()
            card_id = row[0]
        # Delete the card
        del_resp = self.client.post(
            "/api/cards/delete",
            json.dumps({"cardId": card_id, "userEmail": self.email}),
            content_type="application/json",
        )
        self.assertEqual(del_resp.status_code, 200)
        # Ensure card is gone
        load_resp = self.client.get(
            f"/api/cards/load/{self.folder_id}?userEmail={self.email}"
        )
        self.assertEqual(load_resp.status_code, 200)
        self.assertEqual(load_resp.json(), [])
