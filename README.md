# Cardsapp 

A modern web application for managing and studying flashcards. Built with a focus on a clean user interface, seamless deployment, and reliable infrastructure.

## 🚀 Tech Stack

- **Backend:** Python
- **Database:** MySQL
- **Infrastructure:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (Automated Linting with Flake8, Testing with Pytest, and Self-hosted Auto-Deploy)

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
