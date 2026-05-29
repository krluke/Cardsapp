import functools

import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from django.http import JsonResponse

from api.csrf import csrf_protector


def generate_jwt_token(user_id, email):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
    return token


def verify_jwt_token(token):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def jwt_required(view_func):
    @functools.wraps(view_func)
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

        request.user_id = payload["user_id"]
        request.user_email = payload["email"]

        if request.method != "GET":
            csrf_token = request.headers.get("X-CSRF-Token", "")
            if not csrf_protector.validate_token(request.user_email, csrf_token):
                return JsonResponse(
                    {"error": "CSRF token validation failed"}, status=403
                )

        return view_func(request, *args, **kwargs)

    return wrapper


def jwt_optional(view_func):
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_jwt_token(token)
            if payload:
                request.user_id = payload["user_id"]
                request.user_email = payload["email"]
            else:
                request.user_id = None
                request.user_email = None
        else:
            request.user_id = None
            request.user_email = None

        return view_func(request, *args, **kwargs)

    return wrapper
