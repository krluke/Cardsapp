# AGENTS.md - Development Guide

## Project Overview

This is a flashcard application with:
- **Backend**: Python Flask API (`backend/app.py`)
- **Frontend**: Vanilla JavaScript with HTML/CSS templates
- **Database**: MySQL 8.0
- **Infrastructure**: Docker Compose (Nginx + Flask + MySQL)

---

## Build, Run & Development Commands

### Docker Compose (Full Stack)
```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f [service]

# Stop services
docker-compose down
```

### Backend Development
```bash
# Install dependencies locally
pip install -r backend/requirements.txt

# Run Flask dev server (outside Docker)
cd backend && python app.py

# Run a specific test
python -m pytest tests/test_file.py::test_function -v

# Run all tests
python -m pytest tests/

# Run with coverage
python -m pytest tests/ --cov=. --cov-report=term-missing
```

### Frontend Development
```bash
# No build step - pure static files served by Nginx
# Edit files in frontend/static/ and frontend/templates/ directly
```

### Database
```bash
# Connect to MySQL container
docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db

# Run backup
docker exec my-mysql-db mysqldump -u flashcard_user -pflashcards_db > backup_all.sql
```

---

## Code Style Guidelines

### Python (Backend)

**Imports**
- Standard library first, then third-party (flask, pymysql), then local
- One import per line
- Group by: stdlib → third-party → local (with blank lines between)

```python
import os
import smtplib
from email.mime.text import MIMEText

import pymysql
from flask import Flask, request, jsonify

from mymodule import helper
```

**Formatting**
- 4 spaces indentation (no tabs)
- Maximum line length: 120 characters
- Use blank lines to separate logical sections
- Keep functions and route handlers concise (< 100 lines preferred)

**Naming Conventions**
- `snake_case` for variables, functions, and methods
- `SCREAMING_SNAKE_CASE` for constants
- `PascalCase` for class names (if used)
- Descriptive names: `user_email` not `ue`, `get_user_stats` not `gus`

**Types**
- Use type hints for function parameters and return values where helpful
- Current codebase uses dynamic typing - add type hints incrementally

**Error Handling**
- Wrap database operations in try/except blocks
- Return JSON error responses with appropriate HTTP status codes:
  - 400 for client errors (validation, missing data)
  - 401 for authentication failures
  - 500 for server errors
- Always close database connections in finally blocks or use context managers

```python
# Good pattern
conn = get_db()
try:
    with conn.cursor() as c:
        c.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = c.fetchone()
    return jsonify(user), 200
except Exception as e:
    return jsonify({"error": str(e)}), 500
finally:
    conn.close()
```

**Security**
- Never hardcode credentials - use environment variables
- Use parameterized queries (`%s`) to prevent SQL injection
- Sanitize HTML input with `bleach` before storing
- Hash passwords with `werkzeug.security.generate_password_hash`

**Database**
- Use `with conn.cursor() as c:` for automatic cleanup
- Always `conn.commit()` after write operations
- Use `pymysql.cursors.DictCursor` for dict-like row access

---

### JavaScript (Frontend)

**Formatting**
- 4 spaces indentation
- Maximum line length: 120 characters
- Semicolons required
- Use `const` by default, `let` when reassignment needed, avoid `var`

**Naming**
- `camelCase` for variables and functions
- `PascalCase` for constructors and classes
- `SCREAMING_SNAKE_CASE` for constants
- Descriptive names: `currentFolderId` not `fid`

**Error Handling**
- Wrap async fetch calls in try/catch blocks
- Check `response.ok` before parsing JSON
- Show user-friendly error messages via `alert()` or console

```javascript
try {
    const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: session.id, title: title })
    });

    if (res.ok) {
        loadFolders();
    } else {
        alert("作成に失敗しました");
    }
} catch (e) {
    console.error("Error:", e);
    alert("通信エラー");
}
```

**DOM Manipulation**
- Use `document.getElementById()` for single elements
- Use `document.querySelector()` for complex selectors
- Check element existence before manipulation
- Use `classList.add/remove/toggle` instead of className string manipulation

**State Management**
- Store session in `localStorage` as JSON
- Parse with `JSON.parse()` and serialize with `JSON.stringify()`
- Always check for null/undefined before parsing

```javascript
const sessionStr = localStorage.getItem('user_session');
if (!sessionStr) return;
const session = JSON.parse(sessionStr);
```

---

### HTML Templates

- Use semantic HTML5 elements
- Include CSRF protection where applicable
- Keep inline JavaScript minimal - prefer external files
- Use data attributes for JS hooks: `<button data-action="delete">`

---

### CSS

- Use Tailwind CSS via CDN (classes in HTML)
- Custom styles in `frontend/static/*.css` files
- Use meaningful class names
- Follow BEM-like naming for custom components

---

## API Conventions

### Request/Response Format
- All API requests use JSON: `Content-Type: application/json`
- Success responses include appropriate data
- Error responses always include `message` or `error` field

### Endpoints Pattern
```
/api/{resource}/{action}     POST   - Create/update
/api/{resource}/list         GET    - List with filters
/api/{resource}/{id}         GET    - Get single
/api/{resource}/delete       POST   - Delete
```

### Status Codes
- 200: Success
- 400: Bad request / validation error
- 401: Unauthorized
- 404: Not found
- 500: Server error

---

## Testing Guidelines

- Create tests in `backend/tests/` directory
- Use `pytest` framework
- Test naming: `test_{function_name}_{scenario}`
- Include both success and error path tests
- Mock database connections for unit tests

---

## Security Reminders

- **NEVER commit credentials or API keys**
- Use `.env` files for local development (add to `.gitignore`)
- Environment variables for Docker deployment
- Sanitize ALL user input before database insertion
- Validate email formats, length limits, etc.

---

## File Structure

```
/home/luke/server-project/
├── backend/
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile       # Container build config
├── frontend/
│   ├── static/          # CSS, JS, images
│   │   ├── auth.js
│   │   ├── index.js
│   │   ├── editor.js
│   │   ├── viewer.js
│   │   ├── account.js
│   │   └── *.css
│   ├── templates/       # HTML templates
│   │   ├── index.html
│   │   ├── editor.html
│   │   ├── viewer.html
│   │   └── account.html
│   └── nginx/
│       └── default.conf # Nginx configuration
├── docker-compose.yml   # Container orchestration
└── db_data/            # MySQL data directory
```
