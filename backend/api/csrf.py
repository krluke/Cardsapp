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

    def validate_token(self, user_identifier, token):
        if not token or ":" not in token:
            return False
        provided_token, provided_signature = token.rsplit(":", 1)
        expected_signature = hmac.new(
            self._secret_key.encode(),
            f"{user_identifier}:{provided_token}".encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(provided_signature, expected_signature)


csrf_protector = CSRFProtector()
