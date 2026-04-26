from django.apps import AppConfig
import logging
import os
from django.db import connection
from werkzeug.security import generate_password_hash

# Development account constants
DEV_EMAIL = os.environ.get("DEV_EMAIL", "dev@cardsapp.local")
DEV_USERNAME = os.environ.get("DEV_USERNAME", "dev")
DEV_PASSWORD = os.environ.get("DEV_PASSWORD", "")


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        # Import and run the migration on startup
        from .management.commands.fix_srs_columns import Command

        cmd = Command()
        try:
            cmd.handle()
        except Exception as e:
            print(f"Note: Could not run SRS migration: {e}")

        # ----- DEV ACCOUNT AUTO-CREATION / REVOKE (based on DEBUG) -----
        from django.conf import settings

        if getattr(settings, "DEBUG", False) and DEV_PASSWORD:
            dev_hashed_pw = generate_password_hash(DEV_PASSWORD)
            try:
                with connection.cursor() as c:
                    c.execute(
                        """
                        INSERT INTO users (email, username, password)
                        VALUES (%s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            username = VALUES(username),
                            password = VALUES(password)
                        """,
                        (DEV_EMAIL, DEV_USERNAME, dev_hashed_pw),
                    )
                logging.getLogger(__name__).info(
                    "🔧 Development user ensured (email=%s)", DEV_EMAIL
                )
            except Exception as e:
                logging.getLogger(__name__).warning(
                    "⚠️ Failed to ensure dev user (DEBUG=True): %s", e
                )
        else:
            # Revoke dev user when DEBUG is False
            try:
                with connection.cursor() as c:
                    c.execute("DELETE FROM users WHERE email = %s", (DEV_EMAIL,))
                logging.getLogger(__name__).info(
                    "🔧 Development user revoked (DEBUG=False)"
                )
            except Exception as e:
                logging.getLogger(__name__).warning(
                    "⚠️ Failed to revoke dev user (DEBUG=False): %s", e
                )
