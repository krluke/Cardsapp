import json
from django.test import TransactionTestCase, Client
from django.db import connection
from django.conf import settings

from api.jwt_utils import generate_jwt_token


class FullFlowTest(TransactionTestCase):
    def setUp(self):
        self.client = Client()
        self.email = "fullflow@example.com"
        self.username = "fullflow"
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO users (email, username, clerk_user_id) VALUES (%s, %s, %s)",
                (self.email, self.username, "clerk_test_123"),
            )
            c.execute(
                "INSERT INTO folders (user_email, title, visibility) VALUES (%s, %s, %s)",
                (self.email, "My Test Folder", "private"),
            )
            self.folder_id = c.lastrowid
        self.jwt_token = generate_jwt_token(self.email, self.email)
        self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {self.jwt_token}"}
        self.csrf_token = "test-csrf"

    def test_full_api_flow(self):
        # -----------------------------------------------------------------
        # 1) Protected endpoint requires auth
        # -----------------------------------------------------------------
        unauth_resp = self.client.get("/api/folders?tab=my-folders")
        self.assertEqual(unauth_resp.status_code, 401)

        # -----------------------------------------------------------------
        # 2) Folder CRUD – create a second folder via API, list, update, delete
        # -----------------------------------------------------------------
        create_folder_resp = self.client.post(
            "/api/folders/create",
            json.dumps({"title": "Second Folder"}),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(create_folder_resp.status_code, 200)
        second_folder_id = create_folder_resp.json()["folderId"]

        # List my folders – should contain both
        list_resp = self.client.get(
            "/api/folders?tab=my-folders",
            **self.auth_headers,
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
                    "folderId": second_folder_id,
                    "title": "Renamed Folder",
                    "visibility": "public",
                }
            ),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(update_resp.status_code, 200)

        # Delete the original test folder
        delete_resp = self.client.post(
            "/api/folders/delete",
            json.dumps({"folderId": self.folder_id}),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(delete_resp.status_code, 200)

        # -----------------------------------------------------------------
        # 3) Card operations – save, load, edit, delete
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
                    "cards": cards_payload,
                }
            ),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(save_resp.status_code, 200)

        load_resp = self.client.get(
            f"/api/cards/load-auth/{second_folder_id}",
            **self.auth_headers,
        )
        self.assertEqual(load_resp.status_code, 200)
        loaded_cards = load_resp.json()
        self.assertEqual(len(loaded_cards), 2)
        self.assertIn("Front 1", loaded_cards[0]["front"])

        # Delete first card (by ID)
        card_id_to_delete = loaded_cards[0]["id"]
        del_resp = self.client.post(
            "/api/cards/delete",
            json.dumps({"cardId": card_id_to_delete}),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(del_resp.status_code, 200)
        load_again = self.client.get(
            f"/api/cards/load-auth/{second_folder_id}",
            **self.auth_headers,
        )
        self.assertEqual(len(load_again.json()), 1)

        # -----------------------------------------------------------------
        # 4) Toggle actions – like and favorite the folder
        # -----------------------------------------------------------------
        toggle_like = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "folderId": second_folder_id,
                    "action": "like",
                }
            ),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(toggle_like.status_code, 200)
        # Toggle again should remove the like
        toggle_like2 = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "folderId": second_folder_id,
                    "action": "like",
                }
            ),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(toggle_like2.status_code, 200)

        # Favorite toggle
        fav_resp = self.client.post(
            "/api/folders/toggle-action",
            json.dumps(
                {
                    "folderId": second_folder_id,
                    "action": "favorite",
                }
            ),
            content_type="application/json",
            **self.auth_headers,
        )
        self.assertEqual(fav_resp.status_code, 200)

        # -----------------------------------------------------------------
        # 5) User stats
        # -----------------------------------------------------------------
        stats_resp = self.client.get(
            "/api/user/stats",
            **self.auth_headers,
        )
        self.assertEqual(stats_resp.status_code, 200)
        stats = stats_resp.json()
        self.assertEqual(stats["email"], self.email)
