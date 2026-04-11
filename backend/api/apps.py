from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        # Import and run the migration on startup
        from .management.commands.fix_srs_columns import Command
        cmd = Command()
        try:
            cmd.handle()
        except Exception as e:
            print(f"Note: Could not run SRS migration: {e}")