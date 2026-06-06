import os
from django.apps import AppConfig
import logging


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
