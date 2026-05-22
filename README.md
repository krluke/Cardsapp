# Cardsapp

A modern web application for managing and studying flashcards. Built with a focus on a clean user interface, seamless deployment, and reliable infrastructure.

## Tech Stack

- **Backend:** Python 3.9 (Docker) / 3.10 (CI), Django 4.2
- **Database:** MariaDB 11.4 (auto-fallback to SQLite for tests)
- **Frontend:** React 18, Vite 6, Tailwind CSS v4, shadcn/ui
- **Auth:** Clerk (OAuth) + custom JWT (HS256)
- **Infrastructure:** Docker & Docker Compose, nginx, Cloudflare Tunnel
- **CI/CD:** GitHub Actions (Flake8 lint, Pytest, self-hosted auto-deploy)

## Requirements

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.x or higher)
- **Git**

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd Cardsapp
```

### 2. Configure environment variables

```bash
cp .env.example .env
cp .env.frontend.example .env.frontend   # after creating frontend/.env.example locally
```

Edit `.env` with your desired values:

| Variable | Description |
|----------|-------------|
| `MARIADB_ROOT_PASSWORD` | MariaDB root password |
| `MARIADB_PASSWORD` | Password for `flashcard_user` |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_PASS` | App password for Gmail |
| `ADMIN_API_KEY` | Secret key for admin API |
| `SECRET_KEY` | Django secret key |
| `JWT_SECRET_KEY` | JWT authentication secret |
| `CLERK_SECRET_KEY` | Clerk API secret key |
| `CLERK_ISSUER` | Clerk instance issuer URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (also needed in `.env.frontend`) |
| `DEBUG` | Set to `False` for production |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |

### 3. Create the Docker network (one-time)

```bash
docker network create cardsapp-net
```

This external network persists across `docker-compose down`, so internal DNS stays stable and the tunnel reconnects faster.

### 4. Start the application

```bash
docker-compose up -d --build
```

### 5. Start the Cloudflare Tunnel (run once outside compose)

The tunnel runs independently so compose restarts never touch it.

**Option A — Systemd (production):**

```bash
sudo cp infra/cloudflared.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared
```

The service loads `CLOUDFLARE_TOKEN` from `~/server-project/.env` via systemd `EnvironmentFile=` (expands `~` automatically). Adjust the path in the service file if your deploy location differs.

**Option B — Docker run (quick start):**

```bash
. .env && docker run -d --restart always \
  --name cloudflare-tunnel \
  --network cardsapp-net \
  -e TUNNEL_TOKEN="$CLOUDFLARE_TOKEN" \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run
```

### 6. Access the application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000

### 7. Stop

```bash
docker-compose down              # Stops db + backend + frontend; tunnel stays up
docker stop cloudflare-tunnel    # Stop tunnel separately if needed
```

## Development Commands

### Docker

```bash
docker-compose up -d              # Start all services
docker-compose logs -f backend    # Backend logs
docker-compose exec backend python manage.py migrate  # Run migrations
```

### Backend (from `backend/`)

```bash
python manage.py runserver                          # Dev server (port 5000)
python manage.py makemigrations && python manage.py migrate --noinput
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics  # Lint
python -m pytest backend/tests/                     # Run all tests
python -m pytest backend/tests/test_full_flow.py -v # Single test file
```

### Frontend (from `frontend/`)

```bash
npm run dev     # Vite dev server (port 5173, proxies /api/ to backend)
npm run build   # Production build
npm run lint    # ESLint
```

## Features

- **Authentication:** Clerk OAuth + custom JWT, sign-up/login with email or username
- **Flashcard Editor:** WYSIWYG canvas-based card creation with templates (blank, title/subtitle, QA, cloze), image upload
- **Folder System:** Public/private folders with like/favorite functionality, global browse
- **Spaced Repetition (SRS):** SM-2 algorithm for optimized review scheduling
- **Search:** Global search across public folders and cards
- **Import/Export:** Export/import folders as JSON
- **i18n:** Japanese and English, switchable from UI
- **Themes:** Sand & Cream, Dark Mode, Blue
- **Responsive UI:** Clean, intuitive React-based design
- **CI/CD:** Auto-lint, test, and deploy on push to main

## Roadmap

- Administrator page with user reports and website management
- Report function to flag inappropriate public card sets
- Batch creation from Google Sheets or Excel layouts
- Learning mode with progress tracking