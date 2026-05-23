# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Backend**: Python 3.9 (Docker) / 3.10 (CI), Django 4.2, raw SQL — **no ORM in views** (`backend/`)
- **Frontend**: React 18, Vite 6, Tailwind CSS v4, JavaScript (no TypeScript) (`frontend/`)
- **Database**: MariaDB 11.4 (Docker); SQLite auto-fallback for tests
- **Auth**: Custom JWT (HS256, `Authorization: Bearer`) + Clerk (`@clerk/clerk-react`); CSRF via `X-CSRF-Token` header
- **Infra**: Docker Compose (db → backend → frontend); Cloudflare Tunnel runs standalone outside compose

## Commands

### Backend (from `backend/`)

```bash
python manage.py runserver                                             # Dev server (port 5000)
python manage.py makemigrations && python manage.py migrate --noinput  # Schema changes
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics    # Lint (critical only)
python -m pytest backend/tests/                                        # All tests
python -m pytest backend/tests/test_full_flow.py -v                    # Single file
python -m pytest -k "test_full_api_flow" -v                            # Single test by name
```

### Frontend (from `frontend/`)

```bash
npm run dev    # Vite dev server (port 5173, proxies /api/ → backend:5000)
npm run build  # Production build
npm run lint   # ESLint (flat config, --max-warnings=0)
```

No frontend test runner is configured.

### Infrastructure

```bash
docker network create cardsapp-net         # One-time setup (external, persists across compose down)
docker-compose up -d --build              # Start all services
docker-compose down                       # Stop (keeps network + db_data volume)
docker-compose logs -f backend            # Backend logs
docker exec -it my-mariadb-db mariadb -u flashcard_user -pflashcards_db  # DB shell
```

## Architecture

### Backend (`backend/`)

- **All API handlers in one file**: `backend/api/views.py` — every endpoint lives here
- SQL helpers `dictfetchall()` / `dictfetchone()` defined in views.py; always use `%s` parameterized queries
- Django ORM models exist at `api/models.py` for `makemigrations`/`migrate` but are **never used in views**
- Security modules: `api/jwt_utils.py` (`@jwt_required` sets `request.user_id`/`request.user_email`), `api/csrf.py` (HMAC-based double-submit), `api/security_headers.py`
- HTML sanitized with `bleach.clean()` + `CSSSanitizer`; passwords use `werkzeug.security`
- Settings: `cardsapp/settings.py` — DB auto-switches to SQLite when `mysqlclient` unavailable or `"test" in sys.argv`; `CSRF_USE_SESSIONS = True`; CSRF header = `HTTP_X_CSRF_TOKEN`

**API endpoints** (all under `/api/`, flat paths, no trailing slashes):

| Path | Handler | Purpose |
|------|---------|---------|
| `clerk-auth` | `clerk_auth` | Exchange Clerk token → app JWT + CSRF token |
| `user/stats` | `get_user_stats` | User card/folder counts |
| `folders/create` | `create_folder` | Create folder |
| `folders` | `get_folders` | List folders (paginated, supports tab/q params) |
| `folders/update` | `update_folder` | Rename or change visibility |
| `folders/delete` | `delete_folder` | Delete folder |
| `folders/toggle-action` | `toggle_action` | Like/favorite a folder |
| `folders/export` | `export_folder` | Export folder as JSON |
| `folders/import` | `import_folder` | Import folder from JSON |
| `search` | `global_search` | Search public folders and cards |
| `study/cards` | `get_study_cards` | Get cards due for SRS review |
| `study/update` | `update_srs` | Update SRS interval/ease/next_review |
| `cards/upload` | `upload_image` | Upload card image |
| `cards/save` | `save_cards` | Save/update card contents |
| `cards/load-auth/<int:folder_id>` | `load_cards_fixed` | Load cards (only URL-param route) |
| `cards/public` | `get_public_cards` | List all public cards (paginated) |
| `cards/delete` | `delete_card` | Delete a card |

### Frontend (`frontend/`)

**Routing** (React Router in `App.jsx`):

| Path | Component | Notes |
|------|-----------|-------|
| `/home` | `HomePage` | Main hub — folder list, global cards, search |
| `/account` | `AccountPage` | User profile / stats |
| `/editor/:folderId` | `EditorPage` | Canvas-based WYSIWYG card editor |
| `/viewer/:folderId` | `ViewerPage` | Read-only card viewer |
| `/study/:folderId` | `StudyPage` | SRS flashcard review |
| `/privacy-policy` | `PrivacyPolicyPage` | Static |
| `/terms-of-service` | `TermsOfServicePage` | Static |

**Key patterns**:
- `@/` alias → `src/` (configured in `vite.config.js`)
- API layer: `src/lib/api.js` — `apiFetch()` auto-attaches JWT + CSRF, fires `session-expired` event on 401
- `API_BASE = '/api'` — all API calls are relative; nginx proxies `/api/` → `backend:5000` in production, Vite dev server does the same
- Session stored as JSON in `localStorage` under key `session` (contains `token`, `csrfToken`, user info)
- Auth flow: Clerk signs in → frontend calls `/api/clerk-auth` with Clerk token → backend returns app JWT + CSRF token → stored in localStorage → `apiFetch()` attaches both on every request
- Clerk is loaded async from CDN; `main.jsx` renders `<App clerkAvailable={...} />` — the `clerkAvailable` prop gates all Clerk-dependent code
- i18n: inline translation objects in each page/component; keyed by `localStorage['app-lang']`, defaults to `ja`
- **Theming**: CSS custom properties in `index.css` keyed by `[data-theme="..."]` attribute on `<html>`. 20 themes defined (light, dark, blue, sakura, forest, autumn, nord, lavender, matcha, sunset, monochrome, ocean, cyberpunk, wabi-sabi, eclipse, midnight, shadow, polar, amethyst, moss). Theme state persisted in `localStorage['app-theme']`. Clerk appearance is also themed via `buildClerkAppearance()`.
- Editor: canvas-based card creation with `CardCanvas`, `DraggableElement`, `EditorSidebar`, `EditorToolbar`, `FloatingTextToolbar` — supports templates (blank, title/subtitle, QA, cloze), image upload
- `useModal` hook in `components/Modal.jsx` provides `showAlert / showConfirm / showPrompt`

### Docker

- Backend CMD runs `migrate → collectstatic → gunicorn` as one command — do not split
- Backend Dockerfile does a build-time `collectstatic` with `RUNNING_IN_DOCKER=1` and dummy secrets
- Frontend: multi-stage build (node:20-alpine → nginx:alpine); `VITE_CLERK_PUBLISHABLE_KEY` is a build arg; uses `npm install --legacy-peer-deps`
- Frontend nginx config (`nginx/default.conf`): serves React build from `/usr/share/nginx/html`, proxies `/api/` → `backend:5000`, includes CSP headers
- Backend reads env from `/tmp/env/secrets` + `.env` (compose env_file order)
- Cloudflare Tunnel runs standalone outside compose (systemd service or `docker run`)

### CI/CD (`.github/workflows/ci.yml`)

- On push/PR to main: flake8 lint + pytest on Python 3.10 (ubuntu-latest)
- On push to main (merged PR): self-hosted deploy — `git reset --hard origin/main` on `~/server-project`, then `docker-compose up -d --build --force-recreate`, then restart tunnel, then `collectstatic`

## Testing

- Primary test: `backend/tests/test_full_flow.py` (Django `TransactionTestCase` + pytest runner)
- Tests use SQLite (settings.py auto-switches when `"test" in sys.argv`)
- CI won't fail on test discovery issues: `pytest || echo "No tests found, skipping"`

## Key Constraints

- **No ORM in views** — always use raw SQL with `connection.cursor()` and `%s` placeholders
- **Frontend is JavaScript** — never add TypeScript syntax or TSX files
- **Python version mismatch**: Docker = 3.9, CI = 3.10 — keep code compatible with both
- **DB_HOST defaults to `db`** (compose service name), not `localhost` — only works inside Docker
- **`RUNNING_IN_DOCKER=1`** relaxes `SECRET_KEY`/`JWT_SECRET_KEY`/`ALLOWED_HOSTS` requirements
- **Clerk + custom JWT coexist** — `clerk-auth` endpoint bridges Clerk identity to app JWT; both auth paths must be preserved
- **`VITE_CLERK_PUBLISHABLE_KEY`** is a Docker build arg — must be set at build time, not runtime
- **Frontend `.env.frontend`** lives at repo root (used by docker-compose), separate from `frontend/.env.example`
