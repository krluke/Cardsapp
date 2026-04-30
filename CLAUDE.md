# CLAUDE.md: High-Level Overview

## Introduction
Project Cardsapp is a multifaceted application, and this CLAUDE.md file aims to provide an overview of its architecture, structure, and key elements for development and maintenance.

## Building and Linting
To build the project, run `npm run build`. For linting, use `npm run lint`. These commands are essential for preparing the codebase for deployment and ensuring adherence to coding standards.

## Running Tests
Tests can be executed with `npm run test`. This command is crucial for verifying the functionality and integrity of the codebase.

## Code Architecture
The project consists of multiple components, each serving a distinct purpose. The backend, located in `backend/`, handles server-side logic, while the frontend, in `frontend/`, manages client-side interactions. The `api/` directory contains API endpoint definitions, and `services/` holds the business logic for the application.

## Important Files and Directories
- `README.md`: Provides a general introduction to the project, including setup instructions and contribution guidelines.
- `backend/api/views.py`: Contains API endpoint definitions, crucial for understanding how data is handled and exposed to the frontend.
- `frontend/src/components/`: Holds React components used in the frontend, each serving a specific UI purpose.

## Development Workflow
For development, it is recommended to run `npm start` for a local development server. This allows for real-time updates as changes are made to the codebase.

## Commit Messages
Commit messages should follow the standard professional guidelines, focusing on the why and the changes made, not the what.

