import jwt
import os
from datetime import datetime, timedelta, timezone
from django.conf import settings
from django.http import JsonResponse


def generate_jwt_token(user_id, email):
    """Generate JWT token for user authentication"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }

    secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
    token = jwt.encode(payload, secret_key, algorithm="HS256")
    return token


def verify_jwt_token(token):
    """Verify JWT token and return payload if valid"""
    try:
        secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def jwt_required(view_func):
    """Decorator to require JWT authentication for API endpoints"""

    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse(
                {
                    "data": None,
                    "error": {"code": 401, "message": "Authorization token required"},
                },
                status=401,
            )

        token = auth_header.split(" ")[1]
        payload = verify_jwt_token(token)
        if not payload:
            return JsonResponse(
                {
                    "data": None,
                    "error": {"code": 401, "message": "Invalid or expired token"},
                },
                status=401,
            )

        # Add user info to request
        request.user_id = payload["user_id"]
        request.user_email = payload["email"]

        return view_func(request, *args, **kwargs)

    return wrapper


def get_user_from_token(request):
    """Extract user info from JWT token in request"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    return verify_jwt_token(token)


def refresh_jwt_token(request):
    """Refresh JWT token using a valid existing token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    payload = verify_jwt_token(token)
    if not payload:
        return None

    return generate_jwt_token(payload["user_id"], payload["email"])
