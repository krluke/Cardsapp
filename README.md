# Cardsapp

A modern web application for managing and studying flashcards. Built with a focus on a clean user interface, seamless deployment, and reliable infrastructure.

## 🚀 Tech Stack

- **Backend:** Python 3.10, Django 4.2
- **Database:** MariaDB 11.4
- **Frontend:** React 18, Vite 6, Tailwind CSS v4
- **Infrastructure:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (Automated Linting with Flake8, Testing with Pytest, and Self-hosted Auto-Deploy)

## 📋 Requirements

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.x or higher)
- **Git** (for cloning the repository)

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd server-project
```

### 2. Configure environment variables

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your desired values. Required variables:

| Variable | Description |
|----------|-------------|
| `MARIADB_ROOT_PASSWORD` | Password for MariaDB root user |
| `MARIADB_PASSWORD` | Password for the `flashcard_user` |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_PASS` | App password for Gmail |
| `ADMIN_API_KEY` | Secret key for admin API |
| `SECRET_KEY` | Django secret key |
| `JWT_SECRET_KEY` | JWT authentication secret |
| `DEBUG` | Set to `False` for production |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |

### 3. Start the application

Build and start all Docker containers:

```bash
docker-compose up -d --build
```

### 4. Access the application

Once containers are running, open your browser:

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000

### 5. Stop the application

```bash
docker-compose down
```

## 🔧 Development Commands

### Start all services

```bash
docker-compose up -d
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### Run database migrations

```bash
docker-compose exec backend python manage.py migrate
```

### Run tests

```bash
cd backend
python -m pytest tests/
```

### Lint code

```bash
# Backend (flake8)
cd backend
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

# Frontend (ESLint)
cd frontend
npm run lint
```

## ✨ Current Features

- **User Authentication:** Secure sign-up and log-in system with JWT tokens
- **Flashcard Management:** Create, edit, and organize flashcards into folders
- **Folder System:** Public and private folders with like/favorite functionality
- **Spaced Repetition System (SRS):** SM-2 algorithm for optimized card review scheduling
- **Search:** Global search across public folders and cards
- **Import/Export:** Export folders as JSON, import from JSON
- **Responsive UI:** Clean and intuitive React-based design
- **Automated CI/CD:** Every push to main is automatically linted, tested, and deployed to the production server

## 🗺️ Roadmap (Future Features)

- [ ] **Administrator page:** Reports from users and website management
- [ ] **Report function:** Flag inappropriate public card sets
- [ ] **Batch creation:** Create cards from Google Sheets or Excel layouts
- [ ] **Learning mode:** Progress tracking with time-based card memorization tracking