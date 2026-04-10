# Cardsapp 

A modern web application for managing and studying flashcards. Built with a focus on a clean user interface, seamless deployment, and reliable infrastructure.

## 🚀 Tech Stack

- **Backend:** Python 3.9+, Django 4.2
- **Database:** MySQL 8.0
- **Frontend:** Vanilla JavaScript, Tailwind CSS
- **Infrastructure:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (Automated Linting with Flake8, Testing with Pytest, and Self-hosted Auto-Deploy)

## 📋 Requirements

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 1.29 or higher)
- **Git** (for cloning the repository)

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd Cardsapp
```

### 2. Configure environment variables

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your desired values. The following variables are required:

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | Password for MySQL root user |
| `MYSQL_PASSWORD` | Password for the flashcard_user |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_PASS` | App password for Gmail |
| `ADMIN_API_KEY` | Secret key for admin API |

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

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f db
```

### Run database migrations
```bash
docker-compose exec backend python manage.py migrate
```

### Create a superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

## ✨ Current Features

- **User Authentication:** Secure sign-up and log-in system.
- **Account Management:** Users can securely update their passwords and manage their profiles.
- **Responsive UI:** Clean and intuitive design for a better user experience.
- **Automated CI/CD Pipeline:** Every Pull Request is automatically linted and tested. Merging to the `main` branch triggers an automatic deployment to the self-hosted production server.
- **Containerized Environment:** Fully Dockerized backend and database for consistent development and production environments.

## 🗺️ Roadmap (Future Features)

- [ ] **Deck Management:** From public cards, duplicate cards, and organize cards into custom decks.
- [ ] **Learning mode:** Progress tracking. Track how many cards you have memorized in total on your account page (counted by looking at a card for more than 1-2 seconds)
- [ ] **Spaced Repetition System (SRS):** A smart algorithm that optimizes the timing of card reviews to promote memorization.
- [ ] **Batch creation function for card sets** A function to create card sets based on layouts selected in bulk from a list such as Google Sheets or Excel.
- [ ] **Administrator-only page** Creation of reports from users and pages for managing the entire website.
- [ ] **Report function for public card sets** A function that prevents public card sets that are being used incorrectly from being published. Report to the administrator from the flag in the upper right corner of the card tile.
