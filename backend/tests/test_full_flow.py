import json
from django.test import TestCase, Client
from django.db import connection
from django.conf import settings
from werkzeug.security import generate_password_hash

# Ensure the test database uses the same schema as the production app.
# The ORM models are defined in api/models.py and will be used by the views.


class FullFlowTest(TestCase):
    def setUp(self):
        self.client = Client()
        # Create a test user directly via SQL (tables are created by migrations)
        self.email = "fullflow@example.com"
        self.username = "fullflow"
        self.password = "Secret123!"
        self.hashed = generate_password_hash(self.password)
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO users (email, username, password) VALUES (%s, %s, %s)",
                (self.email, self.username, self.hashed),
            )
        # Insert a verification code entry (required by signup flow, not used here)
        with connection.cursor() as c:
            c.execute(
                "REPLACE INTO verification_codes (email, code) VALUES (%s, %s)",
                (self.email, "999999"),
            )
        # Create a folder for the user
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
                (self.email, "My Test Folder", "private"),
            )
            self.folder_id = c.lastrowid

    def test_full_api_flow(self):
        # -----------------------------------------------------------------
        # 1) Login – should return a CSRF token and user info
        # -----------------------------------------------------------------
        login_resp = self.client.post(
            "/api/login",
            json.dumps({"id": self.email, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(login_resp.status_code, 200)
        login_json = login_resp.json()
        self.assertIn("csrfToken", login_json)
        csrf_token = login_json["csrfToken"]

        # -----------------------------------------------------------------
        # 2) Change password – using the token we just received
        # -----------------------------------------------------------------
        new_pass = "NewSecret123!"
        change_resp = self.client.post(
            "/api/user/change-password",
            json.dumps(
                {
                    "userEmail": self.email,
                    "currentPassword": self.password,
                    "newPassword": new_pass,
                    "csrfToken": csrf_token,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(change_resp.status_code, 200)

        # Verify we can login with the new password
        login2_resp = self.client.post(
            "/api/login",
            json.dumps({"id": self.email, "password": new_pass}),
            content_type="application/json",
        )
        self.assertEqual(login2_resp.status_code, 200)

        # -----------------------------------------------------------------
        # 3) Folder CRUD – create a second folder via API, list, update, delete
        # -----------------------------------------------------------------
        create_folder_resp = self.client.post(
            "/api/folders/create",
            json.dumps({"userEmail": self.email, "title": "Second Folder"}),
            content_type="application/json",
        )
        self.assertEqual(create_folder_resp.status_code, 200)
        second_folder_id = create_folder_resp.json()["folderId"]

        # List my folders – should contain both
        list_resp = self.client.get(
            f"/api/folders?userEmail={self.email}&tab=my-folders"
        )
        self.assertEqual(list_resp.status_code, 200)
        folders = list_resp.json()["folders"]
        self.assertTrue(any(f["id"] == self.folder_id for f in folders))
        self.assertTrue(any(f["id"] == second_folder_id for f in folders))

        # Update second folder – change title and make it public
        update_resp = self.client.post(
            "/api/folders/update",
            json.dumps(
                {
                    "userEmail": self.email,
                    "folderId": second_folder_id,
                    "title": "Renamed Folder",
                    "visibility": "public",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(update_resp.status_code, 200)

        # Delete the original test folder
        delete_resp = self.client.post(
            "/api/folders/delete",
            json.dumps({"userEmail": self.email, "folderId": self.folder_id}),
            content_type="application/json",
        )
        self.assertEqual(delete_resp.status_code, 200)

        # -----------------------------------------------------------------
        # 4) Card operations – save, load, edit, delete
        # -----------------------------------------------------------------
        cards_payload = [
            {
                "front": "<p>Front 1</p>",
                "back": "<p>Back 1</p>",
                "frontBg": "",
                "backBg": "",
            },
            {
                "front": "<p>Front 2</p>",
                "back": "<p>Back 2</p>",
                "frontBg": "#fff",
                "backBg": "#eee",
            },
        ]
        save_resp = self.client.post(
            "/api/cards/save",
            json.dumps(
                {
                    "folderId": second_folder_id,
                    "userEmail": self.email,
                    "cards": cards_payload,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(save_resp.status_code, 200)

        load_resp = self.client.get(
            f"/api/cards/load/{second_folder_id}?userEmail={self.email}"
        )
        self.assertEqual(load_resp.status_code, 200)
        loaded_cards = load_resp.json()
        self.assertEqual(len(loaded_cards), 2)
        self.assertIn("Front 1", loaded_cards[0]["front"])

        # Delete first card (by ID)
        card_id_to_delete = loaded_cards[0]["id"]
        del_resp = self.client.post(
            "/api/cards/delete",
            json.dumps({"cardId": card_id_to_delete, "userEmail": self.email}),
            content_type="application/json",
        )
        self.assertEqual(del_resp.status_code, 200)
        # Verify card count reduced
        load_again = self.client.get(
            f"/api/cards/load/{second_folder_id}?userEmail={self.email}"
        )
        self.assertEqual(len(load_again.json()), 1)

        # -----------------------------------------------------------------
        # 5) Toggle actions – like and favorite the folder
        # -----------------------------------------------------------------
        toggle_like = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "userEmail": self.email,
                    "folderId": second_folder_id,
                    "action": "like",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(toggle_like.status_code, 200)
        # Toggle again should remove the like
        toggle_like2 = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "userEmail": self.email,
                    "folderId": second_folder_id,
                    "action": "like",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(toggle_like2.status_code, 200)

        # Favorite toggle
        fav_resp = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "userEmail": self.email,
                    "folderId": second_folder_id,
                    "action": "favorite",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(fav_resp.status_code, 200)

        # -----------------------------------------------------------------
        # 6) Rate limiting – send many login attempts to trigger 429
        # -----------------------------------------------------------------
        for _ in range(35):  # default limit is 30 per minute
            resp = self.client.post(
                "/api/login",
                json.dumps({"id": self.email, "password": new_pass}),
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 429)
