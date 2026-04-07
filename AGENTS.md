# AGENTS.md - Development Guide

## Project Overview

Flashcard application with Python Django API (`backend/api/`), vanilla JS frontend, MySQL 8.0, and Docker Compose (Nginx + Django + MySQL).

## Commands

### Docker (Full Stack)
```bash
docker-compose up -d              # Start all services
docker-compose up -d --build      # Rebuild and start
docker-compose logs -f [service]  # View logs
docker-compose down               # Stop services
```

### Backend
```bash
pip install -r backend/requirements.txt  # Install deps
cd backend && python manage.py runserver # Run dev server

# Migrations
python manage.py makemigrations
python manage.py migrate --noinput

# Linting
flake8 backend/ --count --select=E9,F63,F7,F82 --show-source --statistics
black --check backend/
isort --check-only backend/

# Tests (run from backend/)
python -m pytest tests/                                    # All tests
python -m pytest tests/test_auth.py::test_login_success -v # Single test
python -m pytest tests/ -k "auth" -v                       # Pattern match
python -m pytest tests/ --cov=backend --cov-report=term-missing # Coverage
```

### Frontend
No build step. Edit files in `frontend/static/` and `frontend/templates/` directly.

### Database
```bash
docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db
```

## Code Style

### Python (Backend)
- **Imports**: stdlib → third-party → local, grouped with blank lines
- **Format**: 4 spaces, 120 char max line, blank lines between sections
- **Naming**: `snake_case` for vars/functions, `SCREAMING_SNAKE_CASE` for constants, `PascalCase` for classes
- **Types**: Dynamic typing; add type hints incrementally
- **DB**: Use Django's `django.db.connection` cursor, `commit()` after writes, `dictfetchall()`/`dictfetchone()` for results
- **Errors**: try/except around DB ops, return JSON errors with proper status codes (400/401/403/429/500)
- **Security**: Parameterized queries (`%s`), sanitize with `bleach`, hash passwords with werkzeug, env vars for secrets

### JavaScript (Frontend)
- **Format**: 4 spaces, 120 char max, semicolons required, `const` by default
- **Naming**: `camelCase` for vars/functions, `PascalCase` for classes
- **Errors**: try/catch around fetch, check `response.ok`, user-friendly alerts
- **DOM**: `getElementById()`, `querySelector()`, `classList` for classes
- **State**: Session in `localStorage` as JSON, check null before parsing
- **API**: JSON headers, CSRF tokens, loading states, graceful error handling

### HTML/CSS
- Semantic HTML5, data attributes for JS hooks (`data-action="delete"`)
- Tailwind CSS via CDN, BEM-like naming for custom styles, mobile-responsive

## API Conventions

- All JSON: `Content-Type: application/json`
- Endpoints: `/api/{resource}/{action}` (POST), `/api/{resource}/list` (GET), `/api/{resource}/delete` (POST)
- Status: 200 success, 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 429 rate limit, 500 server error

## CI/CD (GitHub Actions)

- **build-and-test**: Runs on push/PR to `main` — flake8 lint + pytest
- **deploy**: Self-hosted, runs after successful tests on push to `main` — git pull + docker-compose rebuild

## File Structure

```
├── backend/manage.py, requirements.txt, Dockerfile, cardsapp/, api/
├── frontend/static/*.js, *.css | templates/*.html | nginx/default.conf
├── docker-compose.yml, .env.example, README.md
```

## Security

- Never commit credentials — use `.env` and environment variables
- Sanitize all input, validate email/password, use HTTPS in production
- CSRF protection, rate limiting, secure session management
