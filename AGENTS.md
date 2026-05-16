# AGENTS.md

## Stack

- **Backend**: Python 3.9 (Docker) / 3.10 (CI), Django 4.2, raw SQL via `django.db.connection` — **no ORM in views** (`backend/`)
- **Frontend**: React 18, Vite 6, Tailwind CSS v4, JavaScript (no TypeScript) (`frontend/`)
- **Database**: MariaDB 11.4 (Docker); SQLite auto-fallback for tests and when `mysqlclient` unavailable
- **Auth**: Custom JWT (HS256, `Authorization: Bearer` header) + Clerk (`@clerk/clerk-react`); CSRF via `X-CSRF-Token` header on non-GET requests
- **Infra**: Docker-Compose (db → backend → frontend → cloudflared); frontend nginx proxies `/api/` → `backend:5000`

## Commands

### Backend (from `backend/`)

```bash
python manage.py runserver                          # Dev server
python manage.py makemigrations && python manage.py migrate --noinput
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics  # Lint (critical only)
python -m pytest backend/tests/                     # All tests
python -m pytest backend/tests/test_full_flow.py -v  # Single file
python -m pytest backend/tests/test_full_flow.py::FullFlowTest::test_full_api_flow -v  # Single test
```

### Frontend (from `frontend/`)

```bash
npm run dev     # Vite dev server (port 5173)
npm run build   # Production build
npm run lint    # ESLint (flat config, --max-warnings=0)
```

No frontend test runner is configured.

### Infrastructure

```bash
docker-compose up -d --build        # Start all services
docker-compose down                 # Stop
docker-compose logs -f backend      # Backend logs
docker exec -it my-mariadb-db mariadb -u flashcard_user -pflashcards_db  # DB shell
```

## Architecture

### Backend

- **All endpoints in one file**: `backend/api/views.py` (~1379 lines) — every API handler lives here
- SQL helpers: `dictfetchall()` / `dictfetchone()` in views.py; always `%s` parameterized queries
- Security modules: `api/jwt_utils.py` (`@jwt_required`), `api/csrf.py`, `api/rate_limiter.py`, `api/security_headers.py`
- URL routes: `api/urls.py` — all paths are flat (no trailing slashes on API routes except `editor/<id>/` and `viewer/<id>/`)
- Root-level routes in `cardsapp/urls.py` map `editor/<id>/` and `viewer/<id>/` to template-rendering views (these duplicate API routes for direct browser access)
- Admin endpoints require `X-Admin-Key` header matching `ADMIN_API_KEY` env var
- HTML sanitized with `bleach.clean()` + `CSSSanitizer`; passwords use `werkzeug.security`

### Frontend

- Pages: `src/pages/`; components: `src/components/`; UI primitives: `src/components/ui/` (shadcn/ui)
- `@/` alias → `src/` (vite.config.js)
- API layer: `src/lib/api.js` — `apiFetch()` auto-attaches JWT + CSRF, auto-refreshes on 401
- Session stored as JSON in `localStorage` under key `session` (contains `token`, `csrfToken`, user info)
- i18n: inline translation object in `App.jsx` (keyed by `localStorage['app-lang']`, defaults to `ja`)

### Docker

- Backend CMD runs `migrate → collectstatic → gunicorn` as one command — **do not split**
- Backend healthcheck hits `/api/folders?tab=global-folders`; DB healthcheck uses `mariadb-admin ping`
- Frontend Dockerfile receives `VITE_CLERK_PUBLISHABLE_KEY` as build arg

## Testing

- Primary test: `backend/tests/test_full_flow.py` (Django `TestCase` + pytest runner)
- Legacy files ignored via `conftest.py: collect_ignore` — do not add tests to `test_api_flow.py`, `test_auth_flow.py`, `test_auth_flow.py`, `test_folder_flow.py`
- Tests use **SQLite** (settings.py auto-switches when `"test" in sys.argv` or `mysqlclient` missing)
- CI: `pytest || echo "No tests found, skipping"` — CI won't fail on test discovery issues

## Key Gotchas

- **Python version mismatch**: Docker = 3.9, CI = 3.10 — keep code compatible with both
- **DB_HOST defaults to `db`** (compose service name), not `localhost` — only works inside Docker
- **`RUNNING_IN_DOCKER=1`** env var in backend container relaxes `SECRET_KEY`/`JWT_SECRET_KEY`/`ALLOWED_HOSTS` requirements (fallbacks kick in)
- **Frontend is JavaScript** — never add TypeScript syntax
- **Clerk + custom JWT coexist** — `clerk-auth` endpoint bridges Clerk identity to app JWT; both auth paths must be preserved
- **Cloudflare Tunnel** fails without `CLOUDFLARE_TOKEN` in `.env`; safe to ignore for local dev
- **`VITE_CLERK_PUBLISHABLE_KEY`** is a Docker build arg — must be set at build time, not runtime
- **No ORM in views** — always use raw SQL with `connection.cursor()` and `%s` placeholders; never use Django ORM querysets in views
