import json
from django.test import TestCase, Client
from django.db import connection
from werkzeug.security import generate_password_hash


class FolderFlowTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.email = "folderuser@example.com"
        self.username = "folderuser"
        self.password = "FolderPwd1!"
        self.hashed = generate_password_hash(self.password)
        # Ensure users table and insert user
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
        # Ensure folders table exists
        with connection.cursor() as c:
            c.execute("""CREATE TABLE IF NOT EXISTS folders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255),
                title VARCHAR(255),
                visibility VARCHAR(20)
            )""")
        # Ensure folder_likes and folder_favorites tables for later endpoints
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

    def test_create_and_list_folder(self):
        # Create folder via API
        resp = self.client.post(
            "/api/folders/create",
            json.dumps({"userEmail": self.email, "title": "My Test Folder"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        folder_id = resp.json().get("folderId")
        self.assertIsNotNone(folder_id)
        # List folders for user
        resp2 = self.client.get(f"/api/folders?userEmail={self.email}&tab=my-folders")
        self.assertEqual(resp2.status_code, 200)
        data = resp2.json()
        self.assertIn("folders", data)
        self.assertTrue(any(f["id"] == folder_id for f in data["folders"]))

    def test_update_and_delete_folder(self):
        # Create folder first
        create_resp = self.client.post(
            "/api/folders/create",
            json.dumps({"userEmail": self.email, "title": "To Update"}),
            content_type="application/json",
        )
        folder_id = create_resp.json()["folderId"]
        # Update folder title and visibility
        update_resp = self.client.post(
            "/api/folders/update",
            json.dumps(
                {
                    "userEmail": self.email,
                    "folderId": folder_id,
                    "title": "Updated Title",
                    "visibility": "public",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(update_resp.status_code, 200)
        # Verify update via get folders
        get_resp = self.client.get(
            f"/api/folders?userEmail={self.email}&tab=my-folders"
        )
        self.assertEqual(get_resp.status_code, 200)
        folder = next(f for f in get_resp.json()["folders"] if f["id"] == folder_id)
        self.assertEqual(folder["title"], "Updated Title")
        self.assertEqual(folder["visibility"], "public")
        # Delete folder
        del_resp = self.client.post(
            "/api/folders/delete",
            json.dumps({"userEmail": self.email, "folderId": folder_id}),
            content_type="application/json",
        )
        self.assertEqual(del_resp.status_code, 200)
        # Ensure folder no longer exists
        get_resp2 = self.client.get(
            f"/api/folders?userEmail={self.email}&tab=my-folders"
        )
        self.assertFalse(any(f["id"] == folder_id for f in get_resp2.json()["folders"]))
