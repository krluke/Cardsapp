# AGENTS.md – Development Guide

---

## 📖 Project Overview

A **Flashcard** web application built with:
- **Backend** – Python 3.9, Django framework (`backend/`)
- **Frontend** – Vanilla JavaScript, Tailwind CSS (`frontend/static/`, `frontend/templates/`)
- **Database** – MySQL 8.0, running in Docker
- **Infrastructure** – Docker‑Compose orchestrating Nginx, Django, MySQL

The repository follows a **single‑repo** layout where all services reside under the project root.

---

## 🛠️ Core Commands

### Docker (Full Stack)
```bash
# Start all services (detached)
docker-compose up -d

# Re‑build images and start
docker-compose up -d --build

# Follow logs for a specific service (e.g. backend)
docker-compose logs -f backend

# Stop & clean containers/networks/volumes
docker-compose down
```

### Backend (Python)
```bash
# Install Python dependencies (use a virtualenv if desired)
pip install -r backend/requirements.txt

# Run the development server (auto‑reload)
cd backend && python manage.py runserver

# Database migrations
python manage.py makemigrations
python manage.py migrate --noinput
```

#### Linting & Formatting
```bash
# Flake8 – fail on syntax and critical errors
flake8 backend/ \
    --count \
    --select=E9,F63,F7,F82 \
    --show-source \
    --statistics

# Black – strict check (no file modifications)
black --check backend/

# isort – import‑order check
isort --check-only backend/
```

> **Tip:** All three commands can be chained: `flake8 && black --check . && isort --check-only .`

#### Testing
Run from the repository root (or `cd backend`), **always** use the `-m pytest` entry‑point to avoid import conflicts.
```bash
# Run the full test suite
python -m pytest backend/tests/                 # all tests

# Run a single test file or test case
python -m pytest backend/tests/test_auth.py::test_login_success -v

# Run a subset by keyword (case‑insensitive regex)
python -m pytest backend/tests/ -k "auth|login" -v

# Generate coverage report (HTML + terminal summary)
python -m pytest backend/tests/ \
    --cov=backend \
    --cov-report=term-missing \
    --cov-report=html
```

### Frontend (Static Assets)
No build step is required. Edit files directly under:
- `frontend/static/` – JavaScript & CSS
- `frontend/templates/` – HTML Jinja2 templates

Refresh the browser after changes; the development Docker container serves the static files via Nginx.

### Database (MySQL)
```bash
# Open a MySQL shell inside the container
docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db
```
Use standard SQL for migrations and data seeding; the Django ORM is used for most reads/writes.

---

## 📐 Code‑Style Guidelines

### Python (Backend)
#### 📦 Imports
- **Order:** `stdlib` → `third‑party` → `local`
- Separate groups with a blank line.
- Use absolute imports for project modules (`from cardsapp.models import Card`).
- Example:
  ```python
  import os
  import json

  import requests
  from django.db import connection

  from cardsapp.utils import hash_password
  ```

#### 🖋️ Formatting
- Indentation: **4 spaces**, no tabs.
- Maximum line length: **120 characters**.
- End files with a single newline.
- Blank line **between** top‑level definitions (functions, classes).
- Use **Black** (auto‑formatter) and **isort** for consistency.

#### 🏷️ Naming Conventions
- **Modules / Packages:** `snake_case`
- **Variables / Functions:** `snake_case`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Classes:** `PascalCase`
- **Test functions:** `test_<feature>[_<scenario>]`

#### 📚 Types & Annotations
- Dynamic typing is the default; add **type hints** where the intent is non‑obvious.
- Use `typing` primitives (`List`, `Dict`, `Optional`, `Union`).
- Example:
  ```python
  from typing import List, Dict, Optional

  def get_user_cards(user_id: int) -> List[Dict[str, str]]:
      ...
  ```

#### 🛠️ Error Handling & Responses
- Wrap DB calls in `try/except` blocks; log unexpected errors.
- Return JSON error objects with a **consistent schema**:
  ```json
  {"error": "Invalid credentials", "code": 401}
  ```
- Map exceptions to HTTP status codes:
  - `ValueError` → **400 Bad Request**
  - `PermissionError` → **403 Forbidden**
  - `AuthenticationError` (custom) → **401 Unauthorized**
  - Uncaught → **500 Internal Server Error**
- Always include a **`message`** field for end‑user consumption and a **`detail`** field for debugging (only in dev mode).

#### 🔐 Security Practices
- **Never** hard‑code secrets; load them from environment variables (`os.getenv`).
- Use **parameterised queries** (`cursor.execute(sql, [param])`).
- Sanitize user‑generated HTML with **bleach**.
- Hash passwords with **werkzeug.security.generate_password_hash** and verify with `check_password_hash`.
- Enable **CSRF** protection on all POST endpoints (`@csrf_exempt` only when absolutely necessary).
- Validate email format with a regex or Django’s `EmailValidator`.

### JavaScript (Frontend)
#### 📦 Formatting
- Indentation: **4 spaces**.
- Maximum line length: **120 characters**.
- **Semicolons** are required (`eslint` enforces).
- Use `const` for immutable bindings, `let` for mutable ones.
- Prefer **arrow functions** for callbacks unless a named function improves readability.

#### 🏷️ Naming
- **Variables / Functions:** `camelCase`
- **Classes / Constructors:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **DOM hooks:** `data-action="<verb>"` (e.g., `data-action="delete"`).

#### ⚡ Async / Fetch Patterns
```js
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json();
    alert(err.message || 'Server error');
    throw new Error(err.message);
  }
  return response.json();
}
```
- Always check `response.ok` before parsing JSON.
- Centralise error handling; UI‑level code only displays friendly messages.

#### 📦 State Management
- Store session data in **`localStorage`** as a JSON string.
- Guard against `null`/`undefined` when reading:
  ```js
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  ```

#### 🖼️ DOM Interaction
- Use **`document.querySelector`** / **`querySelectorAll`** for modern selectors.
- Manipulate class lists via **`element.classList`**.
- Prefer **event delegation** on a container element for lists of dynamic items.

### HTML / CSS
- Semantic HTML5 (`<header>`, `<main>`, `<section>`, `<article>`).
- TailwindCSS via CDN – keep utilities in the markup; create custom utilities only when needed.
- BEM‑like naming for any custom CSS rules (e.g., `.btn--primary`).
- Ensure responsive design using Tailwind break‑points (`sm:`, `md:`, `lg:`).

---

## 🔌 API Conventions

- **Content‑Type:** `application/json` for all request/response bodies.
- **Endpoint Structure:**
  - `POST /api/{resource}/{action}` – mutating operations
  - `GET  /api/{resource}/list` – paginated list
  - `POST /api/{resource}/delete` – deletion (CSRF protected)
- **Response Envelope:**
  ```json
  {"data": <payload>, "error": null}
  ```
  On error, `data` is `null` and `error` contains `{"code": 400, "message": "..."}`.
- **Status Codes:**
  - `200` – OK
  - `201` – Created
  - `400` – Validation / Bad request
  - `401` – Authentication required
  - `403` – Forbidden
  - `404` – Not found
  - `429` – Rate limit
  - `500` – Internal server error

---

## 🧪 Testing Philosophy

- **Unit tests** live under `backend/tests/` and use **pytest**.
- Keep tests **fast**; avoid external network calls – mock them with `unittest.mock` or `responses`.
- Use **fixtures** for reusable test data (`conftest.py`).
- Name tests descriptively; include the scenario in the function name.
- Aim for **>80%** line coverage; enforce via CI.

### Example Test Skeleton
```python
import pytest
from django.test import Client

@pytest.fixture
def client():
    return Client()

def test_login_success(client):
    response = client.post('/api/auth/login', json={'email': 'test@example.com', 'password': 'secret'})
    assert response.status_code == 200
    assert 'token' in response.json()['data']
```

---

## 📦 CI/CD (GitHub Actions)

- **`ci.yml`** runs on every push/PR to `main`:
  1. Install Python deps.
  2. Run **flake8**, **black**, **isort** checks.
  3. Execute **pytest** with coverage.
  4. Fail the workflow on any lint or test error.
- **`deploy.yml`** (self‑hosted runner) triggers after a successful `ci` run on `main`:
  1. Pull latest code on the server.
  2. Re‑build Docker images & `docker‑compose up -d --build`.
  3. Restart services.

---

## 📂 Repository Layout
```
├─ backend/
│   ├─ cardsapp/          # Django project (settings, urls, wsgi)
│   ├─ manage.py
│   ├─ requirements.txt
│   └─ tests/             # pytest suite
├─ frontend/
│   ├─ static/            # *.js, *.css, images
│   ├─ templates/         # Jinja2 HTML files
│   └─ nginx/default.conf
├─ docker-compose.yml
├─ .env.example           # sample env vars (do NOT commit secrets)
├─ .github/workflows/    # CI/CD pipelines
└─ README.md
```

---

## 🔒 Security & Secrets Handling

- **Never** commit real secrets. Store them in a `.env` file (ignored via `.gitignore`).
- Load secrets in Python via `os.getenv('VAR_NAME')` with sensible defaults for local development.
- Use **HTTPS** in production (TLS termination at Nginx).
- Enable **rate‑limiting** on authentication endpoints (e.g., via Django‑Ratelimit).
- Regularly rotate MySQL passwords and API keys.

---

## 📚 Additional Resources
- [Django Documentation – Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [Flake8 – The Ultimate Guide](https://flake8.pycqa.org/en/latest/)
- [Tailwind CSS Cheat Sheet](https://tailwindcss.com/docs)
- [pytest – Good Practices](https://docs.pytest.org/en/stable/how-to/usage.html)

---

*This file is intended for both human developers and autonomous coding agents. Follow the conventions verbatim to keep the codebase consistent, automated tooling functional, and CI pipelines green.*
