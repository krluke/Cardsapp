from django.apps import AppConfig
import logging
import os
from django.db import connection

DEV_EMAIL = os.environ.get("DEV_EMAIL") or "dev@cardsapp.local"
DEV_USERNAME = os.environ.get("DEV_USERNAME") or "dev"


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        # Skip database operations during build phase (collectstatic)
        if os.environ.get("RUNNING_IN_DOCKER"):
            return

        # Import and run the migration on startup
        from .management.commands.fix_srs_columns import Command

        cmd = Command()
        try:
            cmd.handle()
        except Exception as e:
            print(f"Note: Could not run SRS migration: {e}")

        # ----- DEV ACCOUNT AUTO-CREATION / REVOKE (based on DEBUG) -----
        from django.conf import settings

        if getattr(settings, "DEBUG", False):
            try:
                with connection.cursor() as c:
                    c.execute(
                        """
                        INSERT INTO users (email, username, password, clerk_user_id)
                        VALUES (%s, %s, NULL, %s)
                        ON DUPLICATE KEY UPDATE
                        username = VALUES(username)
                        """,
                        (DEV_EMAIL, DEV_USERNAME, "dev_local"),
                    )
                logging.getLogger(__name__).info(
                    "Dev user ensured (email=%s)", DEV_EMAIL
                )
            except Exception as e:
                logging.getLogger(__name__).warning(
                    "Failed to ensure dev user (DEBUG=True): %s", e
                )
        else:
            # Revoke dev user when DEBUG is False
            try:
                with connection.cursor() as c:
                    c.execute("DELETE FROM users WHERE email = %s", (DEV_EMAIL,))
                logging.getLogger(__name__).info(
                    "Dev user revoked (DEBUG=False)"
                )
            except Exception as e:
                logging.getLogger(__name__).warning(
                    "Failed to revoke dev user (DEBUG=False): %s", e
                )
