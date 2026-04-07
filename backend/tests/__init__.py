import os
import django

# Ensure Django settings are configured for the test suite
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cardsapp.settings")

django.setup()
