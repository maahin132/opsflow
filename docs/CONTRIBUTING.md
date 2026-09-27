# Contributing to OpsFlow

Thank you for your interest in contributing to OpsFlow.

This document defines the development workflow and contribution
standards for the project.

## 1. Development Setup

Before contributing, make sure you have:

- Python 3.12 or a compatible supported version.
- Node.js and npm.
- Git.
- MySQL configured for the backend.

Follow DEVELOPMENT.md for environment setup instructions.

Never commit environment files, credentials, API keys, or passwords.

## 2. Branching Strategy

Use the following branch naming conventions:

- feature/<short-description>
- fix/<short-description>
- docs/<short-description>
- refactor/<short-description>

Examples:

- feature/task-filters
- fix/login-validation
- docs/api-guide
- refactor/project-service

Do not develop directly on the main branch.

## 3. Commit Message Convention

Use clear, descriptive commit messages.

Format:

type: short description

Supported types:

- feat: New functionality.
- fix: Bug fix.
- docs: Documentation changes.
- refactor: Code restructuring without behavior changes.
- test: Tests added or updated.
- chore: Maintenance and tooling changes.
- security: Security-related changes.

Examples:

feat: add task filtering
fix: handle expired sessions
docs: update API documentation
test: add project permission tests

## 4. Pull Request Guidelines

Before opening a pull request:

1. Ensure the branch is based on the latest main.
2. Keep changes focused on one feature or fix.
3. Run relevant backend and frontend checks.
4. Review the changes for accidental secrets or unrelated files.
5. Update documentation when behavior or APIs change.

A pull request should include:

- A clear summary of the changes.
- The reason for the changes.
- Testing performed.
- Screenshots for significant UI changes.

## 5. Backend Standards

- Follow Django and Django REST Framework conventions.
- Keep business logic organized within the appropriate apps.
- Enforce authentication and organization-level permissions.
- Validate incoming data using serializers.
- Add automated tests for new functionality.
- Avoid exposing sensitive information in API responses.

## 6. Frontend Standards

- Use reusable React components.
- Keep API communication inside the services layer.
- Follow the established project design system.
- Implement loading, empty, success, and error states.
- Ensure responsive layouts and accessible interactions.
- Do not commit generated build output or node_modules.

## 7. Security

- Never commit .env files or secrets.
- Validate and authorize all protected operations.
- Do not bypass organization-level access controls.
- Report security vulnerabilities privately to the project maintainer.

## 8. Documentation

Update the relevant documentation when introducing changes.

- README.md: Project overview and getting started.
- DEVELOPMENT.md: Development environment and workflow.
- docs/API_DOCUMENTATION.md: API contracts and endpoints.
- CHANGELOG.md: Significant changes and release history.

Thank you for helping improve OpsFlow.
