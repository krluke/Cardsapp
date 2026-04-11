# AGENTS.md

## Project Overview
- Backend: Python 3.10, Django (`backend/`)
- Frontend: React 18, Vite, Tailwind CSS (`frontend/`)
- Database: MySQL 8.0 (Docker)
- Infrastructure: Docker-Compose

## Core Commands
### Infrastructure
- Up: `docker-compose up -d --build`
- Down: `docker-compose down`
- Logs: `docker-compose logs -f backend`
- DB: `docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db`

### Backend
- Server: `cd backend && python manage.py runserver`
- Migrations: `python manage.py makemigrations && python manage.py migrate --noinput`
- Lint: `flake8 backend/ --select=E9,F63,F7,F82`
- Tests: `python -m pytest backend/tests/` (Use `conftest.py` fixtures)

### Frontend
- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`

## Conventions
### Backend (Python)
- Imports: stdlib -> third-party -> local. Absolute imports.
- Naming: `snake_case` vars/funcs, `PascalCase` classes.
- Responses: `{"data": <payload>, "error": null}` or `{"data": null, "error": {"code": 400, "message": "..."}}`.
- Security: Use `os.getenv` for secrets. Hash passwords with `werkzeug.security`.

### Frontend (JS/React)
- Naming: `camelCase` vars/funcs, `PascalCase` components.
- API: Use `fetch` with `X-CSRFToken` header.
- State: Local session data in `localStorage` as JSON.

## Layout
- `backend/api/`: Business logic
- `backend/tests/`: Pytest suite
- `frontend/src/`: React source
- `docker-compose.yml`: Orchestration
