# AGENTS.md

## Project Overview

- **Backend**: Python 3.10, Django 4.2 (`backend/`)
- **Frontend**: React 18, Vite 6, Tailwind CSS v4 (`frontend/`)
- **Database**: MySQL 8.0 (Docker)
- **Infrastructure**: Docker-Compose
- **Testing**: pytest with Django TestCase
- **Linting**: flake8 (backend), ESLint flat config (frontend)

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

**Naming Conventions**
- Variables/functions: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_prefixed_with_underscore`

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
- Secrets: `os.getenv("SECRET_NAME")` - never hardcode
- Passwords: Use `werkzeug.security.generate_password_hash()` / `check_password_hash()`
- SQL: Always use parameterized queries with `%s` placeholders
- HTML: Sanitize with `bleach.clean()` and `CSSSanitizer`

**Database Patterns**
```python
# Use dictfetchall/dictfetchone helpers for raw SQL
with connection.cursor() as c:
    c.execute("SELECT * FROM table WHERE id = %s", (param,))
    result = dictfetchone(c)

# No ORM in views - raw SQL only
```

**Error Handling**
```python
try:
    # operation
except Exception as e:
    logger.error(f"Operation failed: {e}")
    return JsonResponse({"error": "Human-readable message"}, status=500)
```

### Frontend (React/JavaScript)

**Import Order**
```javascript
// React/framework imports
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Third-party libraries
import { X, FolderPlus } from 'lucide-react'

// Components (PascalCase)
import EditorPage from './pages/EditorPage'

// Utilities, styles
import './i18n'
```

**Naming Conventions**
- Variables/functions: `camelCase`
- Components: `PascalCase`
- CSS classes: `kebab-case` (Tailwind) or `snake_case` (CSS modules)
- Constants: `UPPER_SNAKE_CASE` or `camelCase` with `k` prefix (e.g., `kApiBase`)

**Component Patterns**
```javascript
// Functional components with hooks
export default function ComponentName() {
  const [state, setState] = useState(initialValue)

  useEffect(() => {
    // effect
    return () => {} // cleanup
  }, [dependency])

  return <div>...</div>
}

// Compound components with forwardRef
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
)
Button.displayName = "Button"
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

**State Management**
- Session: Store in `localStorage` as JSON (`session` key)
- UI state: React useState/useReducer
- No external state library needed for this app

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

// Array responses (simple)
[{ "id": 1, "title": "..." }]
```

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

### Test Structure
- Primary test file: `backend/tests/test_full_flow.py`
- Legacy tests (ignored): `test_api_flow.py`, `test_auth_flow.py`, `test_card_flow.py`, `test_folder_flow.py`
- Test fixtures: `backend/tests/conftest.py`

### Running Tests
```bash
# All tests
python -m pytest backend/tests/

# Single file with verbose
python -m pytest backend/tests/test_full_flow.py -v

# Single test method
python -m pytest backend/tests/test_full_flow.py::FullFlowTest::test_full_api_flow -v
```

### Test User Setup (via conftest.py)
Tests create users directly via SQL in `setUp()`:
```python
def setUp(self):
    self.client = Client()
    self.email = "test@example.com"
    self.hashed = generate_password_hash("Secret123!")
    with connection.cursor() as c:
        c.execute("INSERT INTO users ...", (self.email, self.username, self.hashed))
```

---

## Directory Layout

```
backend/
├── api/
│   ├── views.py          # All API endpoints (raw SQL)
│   ├── models.py         # Django ORM models
│   ├── urls.py           # URL routing
│   ├── rate_limiter.py   # Rate limiting logic
│   ├── csrf.py           # CSRF token generation
│   └── migrations/       # Database migrations
├── tests/
│   ├── conftest.py       # pytest fixtures & config
│   ├── test_full_flow.py # Primary integration test
│   └── test_*.py         # Legacy tests (ignored)
├── cardsapp/
│   ├── settings.py       # Django settings
│   └── urls.py           # Root URL config
└── manage.py

frontend/
├── src/
│   ├── pages/            # Route pages (HomePage, EditorPage, etc.)
│   ├── components/       # Reusable components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── GlobalSearchModal.jsx
│   │   └── AddToFolderModal.jsx
│   ├── lib/
│   │   └── utils.js      # cn() helper, utilities
│   ├── App.jsx           # Root component with routing
│   ├── main.jsx          # Entry point
│   └── i18n.js           # Translations
├── package.json
├── eslint.config.js      # ESLint flat config
├── tailwind.config.js    # Tailwind v4 config
├── vite.config.js        # Vite config with @ alias
└── components.json       # shadcn/ui schema config
```

---

## Frontend Stack Details

- **Tailwind CSS v4**: Uses `@tailwindcss/vite` plugin, CSS variables for theming
- **shadcn/ui**: Components follow `components.json` schema, placed in `src/components/ui/`
- **Path Aliases**: `@/` maps to `frontend/src/`, configured in `vite.config.js`
- **UI Components**: Use `class-variance-authority` (cva) for variant props
- **Icons**: `lucide-react` library

### Component Import Pattern
```javascript
// shadcn/ui components
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// App components
import { Modal } from '@/components/Modal'
import { GlobalSearchModal } from '@/components/GlobalSearchModal'
```

---

## Security Notes

- All API requests except GET need `X-CSRF-Token` header
- CSRF tokens generated via `api/csrf.py` using HMAC-SHA256
- Passwords hashed with `werkzeug.security` ( Werkzeug 3.x uses scrypt by default)
- SQL injection prevented via parameterized queries only
- HTML sanitization via `bleach` library with allowlist approach
- Rate limiting via `api/rate_limiter.py` (in-memory, per-process)
- Admin endpoints require `X-Admin-Key` header matching `ADMIN_API_KEY`
