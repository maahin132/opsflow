# OpsFlow Changelog

All notable changes to OpsFlow are documented in this file.

This project follows the Keep a Changelog format.

## [Unreleased]

### Added
- Initial React dashboard with light and dark themes.
- Django REST API for authentication and organization management.
- Project and task management APIs.
- Task comments and activity logging.
- Organization-level tenant isolation and role-based access control.
- Backend automated tests.
- API documentation and development guidelines.

### In Progress
- Connect React frontend to the Django REST API.
- Implement frontend authentication using session-based authentication.
- Replace dashboard demonstration data with live API data.
- Integrate organization, project, task, and activity endpoints.
- Implement production-ready loading, empty, and error states.

### Security
- Enforce authentication and organization-level access permissions.
- Keep environment variables and credentials outside version control.

## [0.1.0] - Initial Development

### Added
- Initialized the OpsFlow repository.
- Configured Django backend and React frontend using Vite.
- Added Tailwind CSS, Framer Motion, React Router, Axios, and Lucide icons.
- Implemented custom user authentication.
- Added organization and membership management.
- Implemented project management APIs.
- Implemented task management APIs with statuses and priorities.
- Added task comments and activity history.
- Configured Django admin for backend models.
- Added automated backend tests.

### Testing
- Backend test suite passed 59 tests at the documented development checkpoint.

### Notes
- The frontend dashboard currently uses demonstration data.
- Frontend API integration is pending.
- This is an active development project, not a production release.

---

## Changelog Guidelines

- Added: New features.
- Changed: Changes to existing functionality.
- Fixed: Bug fixes.
- Removed: Removed functionality.
- Security: Security-related changes.

Record significant changes under Unreleased.

When publishing a release, move completed entries into a
versioned section and include the release date.

Never include passwords, API keys, tokens, or other secrets.
