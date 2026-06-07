# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-01

### Added
- **Backend (FastAPI)**:
  - Auth system with JWT token generation and verification.
  - Integration with Gemini API and Hugging Face API for summarization and image generation.
  - Chat session CRUD endpoints (create, read, update, delete).
  - PostgreSQL database integration with SQLAlchemy ORM.
- **Frontend (React)**:
  - SPA setup using React and Vite.
  - Login and Registration UI components.
  - Chat history page and chatbot interface with AI.
- **Docker & Devops**:
  - Dockerfiles for backend and frontend.
  - `docker-compose.yml` configuration.
  - Makefile shortcuts for running up/down commands.

## [1.1.0] - 2026-06-07

### Added
- **Frontend (React)**:
  - Dark Mode and Light Mode support with state management, persisting selection in `localStorage`.
  - Dark mode toggle button in `Header`.
  - Real team member information with actual names and NIMs in `AboutUs` component.
  - Unit tests for `AboutUs`, `Header`, and `ChatHistoryPage` components.
- **CI/CD & DevOps**:
  - GitHub Actions CI workflow file `.github/workflows/ci.yml` supporting parallel jobs.
  - Branch Protection setup with `CODEOWNERS` for automatic review assignment.
  - Real commands in `Makefile` for `lint` and `test` targets.
  - Documentation for Git workflow in `docs/git-workflow.md`.
