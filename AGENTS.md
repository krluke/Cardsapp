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

# Run tests (create tests directory first if needed)
# Run all tests
python -m pytest tests/

# Run a specific test (replace with actual test path)
python -m pytest tests/test_auth.py::test_login_success -v

# Run tests with coverage
python -m pytest tests/ --cov=backend --cov-report=term-missing

# Run specific test file
python -m pytest tests/test_folders.py -v

# Run tests matching pattern
python -m pytest tests/ -k "auth" -v

# Code quality checks
flake8 backend/ --count --select=E9,F63,F7,F82 --show-source --statistics
black --check backend/
isort --check-only backend/
```

### Frontend Development
```bash
# No build step - pure static files served by Nginx
# Edit files in frontend/static/ and frontend/templates/ directly

# Validate HTML
# Install html-validator if needed: npm install -g html-validator
# html-validator frontend/templates/*.html

# Validate CSS
# Install stylelint if needed: npm install -g stylelint
# stylelint frontend/static/**/*.css

# Validate JavaScript
# Install eslint if needed: npm install -g eslint
# eslint frontend/static/**/*.js

# Fix JavaScript formatting
# eslint frontend/static/**/*.js --fix
```

### Database
```bash
# Connect to MySQL container
docker exec -it my-mysql-db mysql -u flashcard_user -pflashcards_db

# Run backup
docker exec my-mysql-db mysqldump -u flashcard_user -pflashcards_db > backup_all.sql

# Restore backup
cat backup_all.sql | docker exec -i my-mysql-db mysql -u flashcard_user -pflashcards_db

# Reset database (dangerous - removes all data)
# docker-compose down -v && docker-compose up -d
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
import random
import secrets
import hashlib
import hmac
import json
import time
import threading
from email.mime.text import MIMEText
from functools import wraps

import pymysql
from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
import math
from werkzeug.security import generate_password_hash, check_password_hash
import bleach
```

**Formatting**
- 4 spaces indentation (no tabs)
- Maximum line length: 120 characters
- Use blank lines to separate logical sections
- Keep functions and route handlers concise (< 100 lines preferred)
- Follow existing code patterns in the codebase

**Naming Conventions**
- `snake_case` for variables, functions, and methods
- `SCREAMING_SNAKE_CASE` for constants
- `PascalCase` for class names (if used)
- Descriptive names: `user_email` not `ue`, `get_user_stats` not `gus`
- Constants like `BASE_DIR`, `PROJECT_DIR`, `FRONTEND_DIR` use SCREAMING_SNAKE_CASE

**Types**
- Use type hints for function parameters and return values where helpful
- Current codebase uses dynamic typing - add type hints incrementally
- For complex return types, use comments or docstrings

**Error Handling**
- Wrap database operations in try/except blocks
- Return JSON error responses with appropriate HTTP status codes:
  - 400 for client errors (validation, missing data)
  - 401 for authentication failures
  - 403 for forbidden access (CSRF, permission issues)
  - 429 for rate limiting
  - 500 for server errors
- Always close database connections in finally blocks or use context managers
- Log unexpected errors for debugging

```python
# Good pattern from the codebase
def get_db():
    return pymysql.connect(
        host=os.environ.get('DB_HOST', 'db'),
        user=os.environ.get('DB_USER', 'flashcard_user'),
        password=os.environ.get('DB_PASSWORD', 'flashcard_pass'),
        database=os.environ.get('DB_NAME', 'flashcards_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# In route handlers:
conn = get_db()
try:
    with conn.cursor() as c:
        c.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = c.fetchone()
    return jsonify(user), 200
except Exception as e:
    app.logger.error(f"Database error: {e}")
    return jsonify({"error": "Internal server error"}), 500
finally:
    conn.close()
```

**Security**
- Never hardcode credentials - use environment variables
- Use parameterized queries (`%s`) to prevent SQL injection
- Sanitize HTML input with `bleach` before storing
- Hash passwords with `werkzeug.security.generate_password_hash`
- Implement rate limiting to prevent abuse
- Use CSRF protection (double-submit cookie pattern)
- Validate and sanitize all user inputs

**Database**
- Use `with conn.cursor() as c:` for automatic cleanup
- Always `conn.commit()` after write operations
- Use `pymysql.cursors.DictCursor` for dict-like row access
- Handle database connection errors gracefully
- Use connection pooling in production (consider SQLAlchemy or similar)

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
- Follow existing patterns in the codebase

**Error Handling**
- Wrap async fetch calls in try/catch blocks
- Check `response.ok` before parsing JSON
- Show user-friendly error messages via `alert()` or console
- Handle network errors gracefully
- Provide meaningful error messages to users

```javascript
// Following the pattern from auth.js
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
- Minimize direct DOM manipulation; consider using templates

**State Management**
- Store session in `localStorage` as JSON
- Parse with `JSON.parse()` and serialize with `JSON.stringify()`
- Always check for null/undefined before parsing
- Consider implementing a simple state management pattern
- Clear stale data when appropriate

```javascript
// Following the pattern from index.js
const sessionStr = localStorage.getItem('user_session');
if (!sessionStr) return;
const session = JSON.parse(sessionStr);
```

**API Communication**
- Always set proper headers for JSON requests
- Handle CSRF tokens for state-changing operations
- Use consistent error handling patterns
- Implement loading states for better UX
- Cancel unnecessary requests when components unmount

---

### HTML Templates

- Use semantic HTML5 elements
- Include CSRF protection where applicable (handled by backend)
- Keep inline JavaScript minimal - prefer external files
- Use data attributes for JS hooks: `<button data-action="delete">`
- Follow accessibility guidelines (WCAG)
- Use proper form labeling and validation
- Ensure responsive design principles

---

### CSS

- Use Tailwind CSS via CDN (classes in HTML)
- Custom styles in `frontend/static/*.css` files
- Use meaningful class names
- Follow BEM-like naming for custom components
- Maintain consistency with existing styles
- Use CSS variables for theme colors where appropriate
- Ensure mobile-responsive designs

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

### Status Codes
- 200: Success
- 400: Bad request / validation error
- 401: Unauthorized
- 403: Forbidden (CSRF, permission issues)
- 404: Not found
- 429: Too Many Requests (rate limiting)
- 500: Server error

### Specific Patterns from Codebase
- Authentication endpoints: `/api/login`, `/api/signup`, `/api/send-code`
- Folder management: `/api/folders/create`, `/api/folders/list`, `/api/folders/update`, `/api/folders/delete`
- Card management: `/api/cards/save`, `/api/cards/load/<int:folder_id>`, `/api/cards/delete`
- User stats: `/api/user/stats`
- Social features: `/api/folders/toggle-action` (likes/favorites)
- Global folders: `/api/folders/global`

---

## Testing Guidelines

- Create tests in `backend/tests/` directory (directory doesn't exist yet)
- Use `pytest` framework
- Test naming: `test_{function_name}_{scenario}`
- Include both success and error path tests
- Mock database connections for unit tests
- Test edge cases and boundary conditions
- Aim for high coverage of critical paths

When tests are implemented:
```bash
# Run all tests
python -m pytest tests/

# Run a specific test (most important for development)
python -m pytest tests/test_auth.py::test_login_success -v

# Run tests with verbose output
python -m pytest tests/test_folders.py -v

# Run with coverage
python -m pytest tests/ --cov=backend --cov-report=term-missing

# Run specific test categories
python -m pytest tests/test_auth.py
python -m pytest tests/test_folders.py
python -m pytest tests/test_cards.py

# Run tests matching a pattern
python -m pytest tests/ -k "login" -v
```

---

## Security Reminders

- **NEVER commit credentials or API keys**
- Use `.env` files for local development (add to `.gitignore`)
- Environment variables for Docker deployment
- Sanitize ALL user input before database insertion
- Validate email formats, length limits, etc.
- Implement proper password policies
- Use HTTPS in production
- Regularly update dependencies
- Conduct security audits periodically
- Implement proper CORS policies
- Use secure session management

---

## File Structure

```
/home/luke/server-project/
├── backend/
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile       # Container build config
│   └── tests/           # Test directory (to be created)
├── frontend/
│   ├── static/          # CSS, JS, images
│   │   ├── auth.js
│   │   ├── index.js
│   │   ├── editor.js
│   │   ├── viewer.js
│   │   ├── account.js
│   │   ├── styles.css
│   │   ├── editor.css
│   │   ├── style.css
│   │   └── account.css
│   ├── templates/       # HTML templates
│   │   ├── index.html
│   │   ├── editor.html
│   │   ├── viewer.html
│   │   └── account.html
│   └── nginx/
│       └── default.conf # Nginx configuration
├── docker-compose.yml   # Container orchestration
├── .env.example         # Environment variables template
└── db_data/            # MySQL data directory
```

---

## Development Best Practices

1. **Environment Variables**: Store sensitive configuration in environment variables, not in code
2. **Database Migrations**: Consider using Alembic or similar for schema changes in production
3. **Logging**: Use structured logging for better debugging and monitoring
4. **Performance**: Implement caching where appropriate (Redis, etc.)
5. **Monitoring**: Add health check endpoints and metrics collection
6. **Documentation**: Keep API documentation up-to-date
7. **Code Reviews**: Implement pull request review process
8. **Continuous Integration**: Set up automated testing and deployment pipelines
9. **Backup Strategy**: Regular automated backups of the database
10. **Disaster Recovery**: Have a plan for data recovery and service restoration

When making changes:
- Follow the existing code patterns
- Write tests for new functionality
- Update documentation as needed
- Run linters and formatters before committing
- Test changes thoroughly in development environment