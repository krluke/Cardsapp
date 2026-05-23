# AGENTS.md

## Stack

- **Backend**: Python 3.9 (Docker) / 3.10 (CI), Django 4.2, raw SQL via `django.db.connection` — **no ORM in views** (`backend/`)
- **Frontend**: React 18, Vite 6, Tailwind CSS v4 (`@import "tailwindcss"` in CSS + `@tailwindcss/vite` plugin), JavaScript (no TypeScript) (`frontend/`)
- **Database**: MariaDB 11.4 (Docker); SQLite auto-fallback for tests and when `mysqlclient` unavailable
- **Auth**: Custom JWT (HS256, `Authorization: Bearer` header) + Clerk (`@clerk/clerk-react`); CSRF via `X-CSRF-Token` header on non-GET requests
- **Infra**: Docker-Compose (db → backend → frontend); frontend nginx proxies `/api/` → `backend:5000`; Cloudflare Tunnel runs standalone outside compose

## Commands

### Backend (from `backend/`)

```bash
python manage.py runserver                                    # Dev server (port 5000)
python manage.py makemigrations && python manage.py migrate --noinput
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics  # Lint (critical errors only)
python -m pytest backend/tests/                               # All tests
python -m pytest backend/tests/test_full_flow.py -v          # Single file
python -m pytest backend/tests/test_full_flow.py::FullFlowTest::test_full_api_flow -v  # Single test
```

### Frontend (from `frontend/`)

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint flat config, --max-warnings=0
```

No frontend test runner is configured.

### Infrastructure

```bash
docker network create cardsapp-net   # One-time: external network persists across compose down
docker-compose up -d --build        # Start all services
docker-compose down                  # Stop (keeps network)
docker-compose logs -f backend       # Backend logs
docker exec -it my-mariadb-db mariadb -u flashcard_user -pflashcards_db  # DB shell
```

Cloudflare Tunnel runs outside docker-compose (systemd service or standalone `docker run`):

```bash
# Standalone (CLOUDFLARE_TOKEN must be set in .env)
. .env && docker run -d --restart always --name cloudflare-tunnel \
  --network cardsapp-net -e TUNNEL_TOKEN="$CLOUDFLARE_TOKEN" \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run

# Systemd (see infra/cloudflared.service)
sudo cp infra/cloudflared.service /etc/systemd/system/ && sudo systemctl enable --now cloudflared
```

## Architecture

### Backend

- **All endpoints in one file**: `backend/api/views.py` — every API handler lives here
- SQL helpers: `dictfetchall()` / `dictfetchone()` in views.py; always use `%s` parameterized queries
- Django ORM models exist at `api/models.py` (for `makemigrations`/`migrate`) but **never used in views** — views use raw SQL only
- Security: `api/jwt_utils.py` (`@jwt_required` sets `request.user_id`/`request.user_email`), `api/csrf.py`, `api/security_headers.py`
- URL routes: `api/urls.py` — API paths are flat, no trailing slashes; `cards/load-auth/<int:id>` is the only URL-param route
- HTML sanitized with `bleach.clean()` + `CSSSanitizer`; passwords use `werkzeug.security`

### Frontend

- Pages: `src/pages/`; components: `src/components/`
- `@/` alias → `src/` (vite.config.js)
- Tailwind v4: `@import "tailwindcss"` in `src/index.css` + `@tailwindcss/vite` plugin
- API layer: `src/lib/api.js` — `apiFetch()` auto-attaches JWT + CSRF, fires `session-expired` event on 401
- Clerk is loaded async from CDN; `main.jsx` renders `<App clerkAvailable={...} />` — the `clerkAvailable` prop gates all Clerk-dependent code
- Session stored as JSON in `localStorage` under key `session` (contains `token`, `csrfToken`, user info)
- i18n: inline translation objects in each page/component; keyed by `localStorage['app-lang']`, defaults to `ja`

### Docker

- Backend CMD runs `migrate → collectstatic → gunicorn` as one command — **do not split**
- Frontend Dockerfile receives `VITE_CLERK_PUBLISHABLE_KEY` as build arg; uses `npm install --legacy-peer-deps`

## Testing

- Primary test: `backend/tests/test_full_flow.py` (Django `TransactionTestCase` + pytest runner)
- Tests use **SQLite** (settings.py auto-switches when `"test" in sys.argv` or `mysqlclient` unavailable)
- CI: `pytest || echo "No tests found, skipping"` — CI won't fail on test discovery issues

## Key Gotchas

- **No ORM in views** — always use raw SQL with `connection.cursor()` and `%s` placeholders; never use Django ORM querysets in views
- **Frontend is JavaScript** — never add TypeScript syntax or TSX files
- **Python version mismatch**: Docker = 3.9, CI = 3.10 — keep code compatible with both
- **DB_HOST defaults to `db`** (compose service name), not `localhost` — only works inside Docker
- **`RUNNING_IN_DOCKER=1`** relaxes `SECRET_KEY`/`JWT_SECRET_KEY`/`ALLOWED_HOSTS` requirements (fallbacks kick in)
- **Clerk + custom JWT coexist** — `clerk-auth` endpoint bridges Clerk identity to app JWT; both auth paths must be preserved
- **`VITE_CLERK_PUBLISHABLE_KEY`** is a Docker build arg — must be set at build time, not runtime
- **Frontend `.env.frontend`** lives at repo root (used by docker-compose), separate from `frontend/.env.example`
- **Cloudflare Tunnel** fails without `CLOUDFLARE_TOKEN` in `.env`; safe to ignore for local dev
