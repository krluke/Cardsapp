import time
from collections import defaultdict
from threading import Lock

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class RateLimitMiddleware(MiddlewareMixin):
    RATE_LIMITS = {
        "/api/cards/load-auth": {"max_requests": 30, "window": 60},
        "/api/study/cards": {"max_requests": 30, "window": 60},
    }

    def __init__(self, get_response=None):
        self.get_response = get_response
        self._lock = Lock()
        self._requests = defaultdict(list)

    def _get_key(self, request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        ip = forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR", "0.0.0.0")
        user_email = getattr(request, "user_email", None) or ""
        return f"{ip}:{user_email}"

    def _check_rate_limit(self, request):
        path = request.path
        matched_prefix = None
        for prefix in self.RATE_LIMITS:
            if path.startswith(prefix):
                matched_prefix = prefix
                break
        if not matched_prefix:
            return None

        config = self.RATE_LIMITS[matched_prefix]
        key = self._get_key(request)
        now = time.time()

        with self._lock:
            timestamps = self._requests[key]
            self._requests[key] = [t for t in timestamps if now - t < config["window"]]
            self._requests[key].append(now)

            if len(self._requests[key]) > config["max_requests"]:
                return config["window"]

        self._cleanup(now)
        return None

    def _cleanup(self, now):
        with self._lock:
            expired_keys = []
            for key, timestamps in self._requests.items():
                self._requests[key] = [t for t in timestamps if now - t < 300]
                if not self._requests[key]:
                    expired_keys.append(key)
            for key in expired_keys:
                del self._requests[key]

    def process_request(self, request):
        retry_after = self._check_rate_limit(request)
        if retry_after is not None:
            return JsonResponse(
                {"message": "Rate limit exceeded. Please try again later."},
                status=429,
                headers={"Retry-After": str(int(retry_after))},
            )
        return None
