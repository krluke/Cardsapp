# AGENTS.md

## Project Overview

- **Backend**: Python 3.9 (Docker) / 3.10 (CI), Django 4.2, raw SQL only (no ORM in views) (`backend/`)
- **Frontend**: React 18, Vite 6, Tailwind CSS v4, JavaScript (no TypeScript) (`frontend/`)
- **Database**: MariaDB 11.4 (Docker)
- **Infrastructure**: Docker-Compose (4 services: db, backend, frontend, cloudflared)
- **Auth**: JWT tokens (HS256, 24h expiry) + CSRF protection (HMAC-SHA256)
- **Testing**: pytest with Django TestCase
- **Linting**: flake8 (backend), ESLint flat config (frontend)
- **CI/CD**: GitHub Actions — lint + test on push/PR to main, auto-deploy via self-hosted runner

---

## Commands

### Infrastructure
```bash
# Start all services
docker-compose up -d --build

# Stop all services
docker-compose down

# View backend logs
docker-compose logs -f backend

# Access MariaDB database
docker exec -it my-mariadb-db mariadb -u flashcard_user -pflashcards_db
```

### Backend
```bash
cd backend

# Run development server
python manage.py runserver

# Create and apply migrations
python manage.py makemigrations && python manage.py migrate --noinput

# Lint (only critical errors)
flake8 backend/ --select=E9,F63,F7,F82

# Run all tests
python -m pytest backend/tests/

# Run a specific test file
python -m pytest backend/tests/test_full_flow.py -v

# Run a specific test
python -m pytest backend/tests/test_full_flow.py::FullFlowTest::test_full_api_flow -v
```

### Frontend
```bash
cd frontend

# Development server with hot reload
npm run dev

# Production build
npm run build

# Lint (ESLint flat config)
npm run lint

# Preview production build
npm run preview
```

---

## Architecture

### Backend (`backend/api/views.py`)
- All API endpoints live in a single `views.py` (~1279 lines)
- **No ORM in views** — raw SQL only via `django.db.connection`
- Use `dictfetchall()` / `dictfetchone()` helpers to convert cursor results
- SQL always uses `%s` parameterized queries
- `api/jwt_utils.py` — JWT generation, verification, `@jwt_required` decorator
- `api/csrf.py` — CSRF token generation/verification
- `api/rate_limiter.py` — in-memory per-process rate limiting
- `api/security_headers.py` — security header middleware
- `api/management/` — custom Django management commands

### Frontend
- Pages in `frontend/src/pages/`, components in `frontend/src/components/`
- shadcn/ui components in `frontend/src/components/ui/`
- `@/` path alias maps to `frontend/src/` (vite.config.js)
- Session stored in `localStorage` as JSON under key `session`

### Services (docker-compose.yml)
| Service | Port | Notes |
|---------|------|-------|
| db | 3306 | MariaDB 11.4, healthcheck ping |
| backend | 5000 | gunicorn 3 workers, depends on db healthy |
| frontend | 8080:80 | Nginx serving built static files |
| cloudflared | — | Cloudflare Tunnel (requires CLOUDFLARE_TOKEN) |

---

## Code Style

### Backend (Python)

**Import Order**
```python
# stdlib
import os
import json
import logging
from datetime import datetime

# third-party
from django.conf import settings
from django.db import connection
from werkzeug.security import generate_password_hash

# local (absolute imports)
from api.rate_limiter import rate_limiter
from api.csrf import csrf_protector
```

**Response Format**
```python
# Success
return JsonResponse({"data": <payload>, "error": None})

# Error
return JsonResponse(
    {"data": None, "error": {"code": 400, "message": "..."}},
    status=400
)
```

**Security**
- Secrets: `os.getenv("SECRET_NAME")` — never hardcode
- Passwords: `werkzeug.security.generate_password_hash()` / `check_password_hash()`
- SQL: Always parameterized queries with `%s` placeholders
- HTML: Sanitize with `bleach.clean()` and `CSSSanitizer`

### Frontend (React/JavaScript)

**Component Patterns**
```javascript
// Functional components with hooks
export default function ComponentName() {
  const [state, setState] = useState(initialValue)
  return <div>...</div>
}

// shadcn/ui components use class-variance-authority
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

**API Calls**
```javascript
const getCsrfToken = () => {
  const session = JSON.parse(localStorage.getItem('session') || '{}')
  return session.csrfToken || ''
}

const apiCall = async (endpoint, data) => {
  const res = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken()
    },
    body: JSON.stringify(data)
  })
  return res.json()
}
```

---

## API Conventions

### Response Envelope
```javascript
// Success
{ "data": <result>, "error": null }

// Error
{ "data": null, "error": { "code": <status>, "message": "<msg>" } }

// List responses
{ "folders": [...], "totalPages": 5, "currentPage": 1 }
```

### Authentication
- JWT token sent in request (handled by `@jwt_required` decorator on protected endpoints)
- All non-GET requests require `X-CSRF-Token` header
- Admin endpoints require `X-Admin-Key` header matching `ADMIN_API_KEY` env var

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthorized (bad credentials) |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |

---

## Testing

- Primary test file: `backend/tests/test_full_flow.py`
- Legacy tests (ignored): `test_api_flow.py`, `test_auth_flow.py`, `test_card_flow.py`, `test_folder_flow.py`
- Test fixtures: `backend/tests/conftest.py`
- Tests create users directly via SQL in `setUp()`
- CI runs `pytest` with `|| echo "No tests found, skipping"` fallback

---

## CI/CD (`.github/workflows/ci.yml`)

1. **build-and-test**: Python 3.10, pip cache, flake8 lint, pytest
2. **deploy** (self-hosted runner): triggers on push/merge to main
   - `git reset --hard origin/main` in `~/server-project`
   - `docker-compose down --remove-orphans`
   - `docker buildx prune -f`
   - `docker-compose up -d --build --force-recreate`
   - `collectstatic` after startup

---

## Key Gotchas

- **Python version mismatch**: Dockerfile uses `python:3.9-slim`, CI uses 3.10. Keep code compatible with both.
- **Backend Dockerfile CMD**: runs `migrate` → `collectstatic` → `gunicorn` in one command. Do not split.
- **DB_HOST defaults to `db`** (the compose service name), not `localhost`.
- **`RUNNING_IN_DOCKER=1`** env var is set for the backend container — affects Django settings.
- **Frontend is JavaScript, not TypeScript** — do not add TypeScript syntax.
- **Cloudflare Tunnel** requires `CLOUDFLARE_TOKEN` in `.env` — service will fail without it.
