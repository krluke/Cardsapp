import secrets
import hashlib
import hmac


class CSRFProtector:
    def __init__(self, secret_key=None):
        from django.conf import settings

        self._secret_key = secret_key or getattr(
            settings, "SECRET_KEY", secrets.token_hex(32)
        )

    def generate_token(self, user_identifier):
        token = secrets.token_hex(32)
        signature = hmac.new(
            self._secret_key.encode(),
            f"{user_identifier}:{token}".encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{token}:{signature}"


csrf_protector = CSRFProtector()
