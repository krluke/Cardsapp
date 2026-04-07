import time
import threading


class RateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._ip_requests = {}
        self._email_requests = {}
        self._login_attempts = {}
        self._blocked_ips = {}

    def _clean_expired(self, store, window):
        now = time.time()
        return {k: v for k, v in store.items() if now - v["last"] < window}

    def is_ip_blocked(self, ip):
        with self._lock:
            if ip in self._blocked_ips:
                if time.time() < self._blocked_ips[ip]["until"]:
                    return self._blocked_ips[ip]["attempts"] >= 3
                del self._blocked_ips[ip]
        return False

    def check_ip_rate_limit(self, ip, max_requests=100, window=60):
        with self._lock:
            now = time.time()
            self._ip_requests = self._clean_expired(self._ip_requests, window)
            if ip not in self._ip_requests:
                self._ip_requests[ip] = {"count": 0, "last": now}
            self._ip_requests[ip]["count"] += 1
            self._ip_requests[ip]["last"] = now
            if self._ip_requests[ip]["count"] > max_requests:
                return False, max_requests - self._ip_requests[ip]["count"]
        return True, 0

    def check_email_rate_limit(self, email, max_requests=3, window=300):
        with self._lock:
            now = time.time()
            self._email_requests = self._clean_expired(self._email_requests, window)
            if email not in self._email_requests:
                self._email_requests[email] = {"count": 0, "last": now}
            self._email_requests[email]["count"] += 1
            self._email_requests[email]["last"] = now
            if self._email_requests[email]["count"] > max_requests:
                retry_after = int(window - (now - self._email_requests[email]["last"]))
                return False, retry_after
        return True, 0

    def record_login_failure(self, identifier, is_ip=True):
        with self._lock:
            key = f"ip:{identifier}" if is_ip else f"email:{identifier}"
            if key not in self._login_attempts:
                self._login_attempts[key] = {"count": 0, "first_failure": time.time()}
            self._login_attempts[key]["count"] += 1
            if self._login_attempts[key]["count"] >= 5:
                block_duration = min(
                    300 * (2 ** (self._login_attempts[key]["count"] - 5)), 3600
                )
                if is_ip:
                    self._blocked_ips[identifier] = {
                        "until": time.time() + block_duration,
                        "attempts": self._login_attempts[key]["count"],
                    }
                return block_duration
        return 0

    def record_login_success(self, identifier, is_ip=True):
        with self._lock:
            key = f"ip:{identifier}" if is_ip else f"email:{identifier}"
            if key in self._login_attempts:
                del self._login_attempts[key]


rate_limiter = RateLimiter()
