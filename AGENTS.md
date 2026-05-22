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
npm run preview # Vite preview server
```

No frontend test runner is configured.

### Infrastructure

```bash
docker network create cardsapp-net  # One-time: external network persists across compose down
docker-compose up -d --build        # Start all services
docker-compose down                 # Stop (keeps network, tunnel reconnects faster)
docker-compose logs -f backend      # Backend logs
docker exec -it my-mariadb-db mariadb -u flashcard_user -pflashcards_db  # DB shell
```

**Cloudflare Tunnel** runs outside docker-compose (systemd service or standalone `docker run`):

```bash
# Standalone start (CLOUDFLARE_TOKEN must be set in env)
. .env && docker run -d --restart always --name cloudflare-tunnel \
  --network cardsapp-net \
  -e TUNNEL_TOKEN="$CLOUDFLARE_TOKEN" \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run

# Systemd (see infra/cloudflared.service)
sudo cp infra/cloudflared.service /etc/systemd/system/ && sudo systemctl enable --now cloudflared

# Management
docker logs cloudflare-tunnel      # View tunnel logs
docker stop cloudflare-tunnel      # Stop tunnel
docker start cloudflare-tunnel     # Start tunnel
```

**CI/CD** (`.github/workflows/ci.yml`) deploys to `~/server-project`. On each deploy:
1. `git fetch origin && git reset --hard origin/main`
2. `docker network inspect cardsapp-net >/dev/null 2>&1 || docker network create cardsapp-net`
3. `docker-compose down --remove-orphans && docker-compose up -d --build --force-recreate`
4. `. ~/server-project/.env && docker rm -f cloudflare-tunnel && docker run -d --restart always --name cloudflare-tunnel --network cardsapp-net -e TUNNEL_TOKEN="$CLOUDFLARE_TOKEN" cloudflare/cloudflared:latest tunnel --no-autoupdate run`

## Architecture

### Backend

- **All endpoints in one file**: `backend/api/views.py` (~1057 lines) — every API handler lives here
- SQL helpers: `dictfetchall()` / `dictfetchone()` in views.py; always `%s` parameterized queries
- Django ORM models exist at `api/models.py` (for `makemigrations`/migrate) but **never used in views** — views use raw SQL only
- Security modules: `api/jwt_utils.py` (`@jwt_required`), `api/csrf.py`, `api/rate_limiter.py`, `api/security_headers.py`
- URL routes: `api/urls.py` — all paths are flat (no trailing slashes on API routes except `editor/<id>/` and `viewer/<id>/`)
- Root-level routes in `cardsapp/urls.py` map `editor/<id>/` and `viewer/<id>/` to template-rendering views (duplicates API routes for direct browser access; `frontend/templates/` dir does not exist in repo)
- Admin endpoints require `X-Admin-Key` header matching `ADMIN_API_KEY` env var
- HTML sanitized with `bleach.clean()` + `CSSSanitizer`; passwords use `werkzeug.security`

### Frontend

- Pages: `src/pages/`; components: `src/components/`; UI primitives: `src/components/ui/` (shadcn/ui via `components.json`, JSX not TSX)
- `@/` alias → `src/` (vite.config.js)
- Tailwind v4: `@import "tailwindcss"` in `src/index.css` + `@tailwindcss/vite` plugin; legacy `tailwind.config.js` preserved for shadcn/ui compatibility
- API layer: `src/lib/api.js` — `apiFetch()` auto-attaches JWT + CSRF, auto-refreshes on 401
- Session stored as JSON in `localStorage` under key `session` (contains `token`, `csrfToken`, user info)
- i18n: inline translation object (superset) in `App.jsx`, plus standalone `src/i18n.js`; keyed by `localStorage['app-lang']`, defaults to `ja`

### Docker

- Backend CMD runs `migrate → collectstatic → gunicorn` as one command — **do not split**
- Frontend Dockerfile receives `VITE_CLERK_PUBLISHABLE_KEY` as build arg; uses `npm install --legacy-peer-deps`

## Testing

- Primary test: `backend/tests/test_full_flow.py` (Django `TestCase` + pytest runner)
- Legacy files ignored via `conftest.py: collect_ignore` — do not add tests to `test_api_flow.py`, `test_auth_flow.py`, `test_card_flow.py`, `test_folder_flow.py`
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
- **Frontend Dockerfile uses `--legacy-peer-deps`** for `npm install`
- **No ORM in views** — always use raw SQL with `connection.cursor()` and `%s` placeholders; never use Django ORM querysets in views
- **Frontend `.env.frontend`** lives at repo root (used by docker-compose), separate from `frontend/.env.example`
