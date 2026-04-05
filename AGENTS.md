# AGENTS.md – Development Guide

## Project Overview
- **Backend** – Python Flask (`backend/app.py`)
- **Frontend** – Vanilla JS, HTML & CSS (`frontend/static/`, `frontend/templates/`)
- **Database** – MySQL 8.0 (Docker service)
- **Infrastructure** – Docker-Compose (Nginx + Flask + MySQL)

- github(build-and-test, deploy)

---

## Build / Run / Test Commands
### Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# Re-build and start
docker-compose up -d --build

# View logs (optional service name)
docker-compose logs -f [service]

# Stop everything
docker-compose down
```

### Backend Development

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the Flask dev server (outside Docker)
cd backend && python app.py

# Run **all** tests
python -m pytest tests/

# Run a **single** test (replace with your test path)
python -m pytest tests/test_auth.py::test_login_success -v

# Run a specific test file
python -m pytest tests/test_folders.py -v

# Run tests matching a pattern
python -m pytest tests/ -k "auth" -v

# Run tests with coverage report
python -m pytest tests/ --cov=backend --cov-report=term-missing
```

### Frontend Development

```bash
# No build step – static files served by Nginx
# Lint / validate helpers (install globally if needed)
npm install -g html-validator stylelint eslint

# Validate HTML templates
html-validator frontend/templates/*.html

# Lint CSS
stylelint frontend/static/**/*.css

# Lint & auto-fix JavaScript
eslint frontend/static/**/*.js
eslint frontend/static/**/*.js --fix
```

### Database Helpers

```bash
# Open a shell to the MySQL container
docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db

# Backup the DB
docker exec my-mysql-db mysqldump -u flashcard_user -pflashcards_db > backup_all.sql

# Restore the DB
cat backup_all.sql | docker exec -i my-mysql-db mysql -u flashcard_user -pflashcards_db
```

---

## Code Style Guidelines
### Python (Backend)
#### Imports
- **Order:** stdlib → third-party → local
- **One per line**
- **Blank line** between groups
```python
import os
import json
from functools import wraps

import pymysql
from flask import Flask, request, jsonify
```
#### Formatting
- 4-space indentation, no tabs
- Max line length: 120 chars
- Blank lines separate logical sections
- Functions < 100 lines where possible
#### Naming
- `snake_case` for variables / functions
- `SCREAMING_SNAKE_CASE` for constants
- `PascalCase` for class names
- Descriptive, not abbreviated (`user_email` not `ue`)
#### Types & Docs
- Add type hints incrementally
- Use docstrings for public functions
```python
def get_user(email: str) -> dict | None:
    """Fetch a user record by email."""
```
#### Error Handling
- Wrap DB work in `try/except`, log the error, return JSON with proper HTTP status
- Close connections via `finally` or context manager
- Standard status codes:
  - 400 → validation / missing data
  - 401 → auth failure
  - 403 → CSRF / permissions
  - 429 → rate limit
  - 500 → internal error
```python
try:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cur.fetchone()
    return jsonify(user), 200
except Exception as e:
    app.logger.error(f"DB error: {e}")
    return jsonify({"error": "Internal server error"}), 500
finally:
    conn.close()
```
#### Security
- Never hard-code secrets – use `os.getenv`
- Parameterised queries (`%s`) everywhere
- Sanitize HTML with `bleach`
- Hash passwords via `werkzeug.security`
- Implement CSRF double-submit cookie pattern

### JavaScript (Frontend)
#### Formatting
- 4-space indentation, semicolons required
- Max line length: 120 chars
- `const` by default, `let` when reassignment needed
#### Naming
- `camelCase` for vars / functions
- `PascalCase` for constructors / classes
- `SCREAMING_SNAKE_CASE` for constant values
#### Async Error Handling
```javascript
try {
  const res = await fetch('/api/folders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: session.id, title })
  });
  if (!res.ok) throw new Error('Server error');
  await res.json();
  loadFolders();
} catch (e) {
  console.error(e);
  alert('通信エラー');
}
```
#### DOM / State
- Use `document.getElementById` / `querySelector`
- Manipulate classes via `classList`
- Store session in `localStorage` as JSON, always guard against `null`
#### API Conventions
- `Content-Type: application/json`
- Include CSRF token header for state-changing requests
- Consistent error messages (`message` field)

### HTML & CSS (Brief)
- Semantic HTML5 elements, minimal inline JS
- Data attributes (`data-action="delete"`) as JS hooks
- Tailwind via CDN, custom CSS in `frontend/static/*.css`
- BEM-like naming for custom classes, variables for theme colours

---

## API Conventions

### Request/Response Format
- All API requests use JSON: `Content-Type: application/json`
- Success responses include appropriate data
- Error responses always include `message` or `error` field
- Consistent response structure across endpoints

### Endpoints Pattern
```
/api/{resource}/{action}     POST   - Create/update
/api/{resource}/list         GET    - List with filters
/api/{resource}/{id}         GET    - Get single
/api/{resource}/delete       POST   - Delete
```

---

## Testing Guidelines
- Tests live under `backend/tests/` (create if missing)
- Use **pytest**
- Naming: `test_<module>_<scenario>.py`
- Mock DB connections with `unittest.mock` or `pytest-mock`
- Run all tests: `python -m pytest tests/`
- Run a single test (most common for developers): `python -m pytest tests/test_auth.py::test_login_success -v`
- Run a file: `python -m pytest tests/test_folders.py -v`
- Run with coverage: `python -m pytest --cov=backend --cov-report=term-missing`

---

## Security & Environment
- Store secrets in a `.env` file (add to `.gitignore`)
- Load via `python-dotenv` or `os.getenv`
- Never commit real credentials
- Enable CORS only for trusted origins (`flask_cors.CORS(app, origins=[...])`)
- Rate-limit critical endpoints (e.g., login, signup)

---

## File Structure Snapshot
```
Cardsapp/
├─ backend/
│  ├─ app.py
│  ├─ requirements.txt
│  ├─ Dockerfile
│  └─ tests/            # pytest suite
├─ frontend/
│  ├─ static/          # js, css, images
│  └─ templates/         # html files
├─ docker-compose.yml
├─ .env.example
└─ AGENTS.md            # (this file)
```

---

## API Endpoints
### Authentication
- `POST /api/login` - User login with email/username and password
- `POST /api/signup` - User registration with email verification
- `POST /api/send-code` - Send verification code to email

### User Management
- `GET /api/user/stats` - Get user statistics
- `GET /account` - User account page
- `GET /change-password` - Change password page

### Folder Management
- `POST /api/folders/create` - Create a new folder
- `GET /api/folders/list` - List user's folders
- `POST /api/folders/update` - Update folder properties
- `POST /api/folders/delete` - Delete a folder
- `GET /api/folders/global` - List public folders
- `GET /api/folders` - Paginated folder listing with search

### Card Management
- `POST /api/cards/save` - Save cards to a folder
- `GET /api/cards/load/<folder_id>` - Load cards from a folder
- `POST /api/cards/delete` - Delete a specific card

### Editor & Viewer
- `GET /` - Main application page
- `GET /editor/<folder_id>` - Folder editor page
- `GET /viewer/<folder_id>` - Folder viewer page

### Like & Favorite System
- `POST /api/folders/toggle-action` - Toggle like/favorite status

### AI Translation
- `POST /api/ai/translate` - AI translation using NVIDIA NIM

---

## Environment Variables
Create a `.env` file based on `.env.example`:
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_PASS` - Gmail app password
- `ADMIN_API_KEY` - Secret key for admin operations
- `MYSQL_ROOT_PASSWORD` - MySQL root password
- `MYSQL_PASSWORD` - MySQL user password
- `NVIDIA_NIM_API_KEY` - NVIDIA NIM API Key (Optional)

## Database Schema
### Users Table
- `email` (PRIMARY KEY) - User's email address
- `username` - Display name
- `password` - Hashed password

### Folders Table
- `id` (AUTO_INCREMENT PRIMARY KEY) - Folder ID
- `user_email` - Owner's email
- `title` - Folder title
- `visibility` - 'private' or 'public'
- `likes` - Like count

### Cards Table
- `id` (AUTO_INCREMENT PRIMARY KEY) - Card ID
- `folder_id` - Parent folder ID
- `order_index` - Card order in folder
- `front_content` - Front content (HTML)
- `back_content` - Back content (HTML)
- `front_bg` - Front background setting
- `back_bg` - Back background setting

### Verification Codes Table
- `email` (PRIMARY KEY) - User email
- `code` - Verification code

### Additional Tables
- `folder_likes` - Track user likes on folders
- `folder_favorites` - Track user favorites
- `users` - User account information
