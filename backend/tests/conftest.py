import pytest

# Ignore the legacy individual test files – they are superseded by test_full_flow.py
collect_ignore = [
    "test_api_flow.py",
    "test_auth_flow.py",
    "test_card_flow.py",
    "test_folder_flow.py",
]
