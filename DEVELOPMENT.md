
# OpsFlow - Development Guide

Last Updated: 27 September 2026

## 1. Project Overview

OpsFlow is a team and project management platform built with
React.js and Django REST Framework.

This document explains how to set up, run, test and maintain
the project in a local Windows development environment.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js + Vite |
| Backend | Python + Django |
| API | Django REST Framework |
| Database | Verify active Django configuration |
| Authentication | Django Session Authentication |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| HTTP Client | Axios |
| Version Control | Git + GitHub |

## 3. Project Structure

Current project root:

C:\OpsFlow

Main directories:

- backend/ - Django backend.
- frontend/ - React frontend.
- docs/ - Technical documentation.

Root documentation:

- README.md - Project introduction and setup overview.
- DEVELOPMENT.md - Local development instructions.
- CHANGELOG.md - Major changes and releases.
- PROJECT_STATUS.md - Local development progress.
- ARCHITECTURE.md - Local system architecture notes.

PROJECT_STATUS.md and ARCHITECTURE.md are local-only
files and are excluded from Git.

## 4. Prerequisites

Install the following tools:

- Python 3.12 or compatible project version.
- Node.js and npm.
- Git.
- MySQL 8, if the active Django configuration uses MySQL.
- Visual Studio Code.

Check installed versions:

```powershell
python --version
node --version
npm --version
git --version
```

Check the database version if MySQL is installed:

```powershell
mysql --version
```

Use the versions compatible with the existing project
configuration. Do not upgrade dependencies without testing.

## 5. Backend Setup

Backend directory:

C:\OpsFlow\backend

### 5.1 Open the Backend

```powershell
cd C:\OpsFlow\backend
```

### 5.2 Activate the Virtual Environment

If the virtual environment already exists:

```powershell
..\.venv\Scripts\Activate.ps1
```

The terminal should show the virtual environment prefix:

```text
(.venv)
```

If PowerShell blocks activation, use the following
for the current terminal session only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate the environment again.

Do not create another virtual environment if the existing
project environment is already working.

### 5.3 Install Backend Dependencies

If requirements.txt exists:

```powershell
python -m pip install -r requirements.txt
```

If dependencies are already installed, avoid unnecessary
package changes.

### 5.4 Environment Configuration

The backend uses environment configuration.

The local .env file should remain private and must not
be committed to Git.

Configuration may include:

- Django secret key.
- Database name.
- Database username and password.
- Database host and port.
- Debug and allowed-host settings.

Use the existing backend .env and Django settings.

Never paste secrets, passwords or API keys into public
documentation, GitHub or chat messages.

### 5.5 Database Configuration

Check the active database configuration in Django settings.

The intended database technology is MySQL, but verify
the active configuration before running database commands.

For MySQL:
- Ensure the MySQL service is running.
- Confirm the configured database exists.
- Confirm the credentials are correct.
- Keep database credentials in environment variables.

For SQLite:
- Django normally uses the configured SQLite database file.
- No MySQL service is required for SQLite.

Do not switch database engines or delete database files
without a planned migration and backup.

### 5.6 Apply Migrations

From the backend directory:

```powershell
python manage.py makemigrations
```

Only create migrations when model changes require them.

Apply existing migrations:

```powershell
python manage.py migrate
```

Check for configuration issues:

```powershell
python manage.py check
```

### 5.7 Start the Backend Server

```powershell
python manage.py runserver
```

Default local address:

http://127.0.0.1:8000/

Keep this terminal running while using the frontend.

## 6. Frontend Setup

Frontend directory:

C:\OpsFlow\frontend

### 6.1 Open the Frontend

Open a second PowerShell terminal:

```powershell
cd C:\OpsFlow\frontend
```

### 6.2 Install Dependencies

```powershell
npm install
```

This installs dependencies defined in package.json.

Do not delete package-lock.json without a reason.

### 6.3 Start the Development Server

```powershell
npm run dev
```

Default Vite development address:

http://localhost:5173/

Open this address in the browser.

Keep the frontend and backend terminals running
simultaneously during development.

## 7. Running Both Servers

Use two separate terminals.

### Terminal 1 - Backend

```powershell
cd C:\OpsFlow\backend
..\.venv\Scripts\Activate.ps1
python manage.py runserver
```

### Terminal 2 - Frontend

```powershell
cd C:\OpsFlow\frontend
npm run dev
```

Frontend:
http://localhost:5173/

Backend:
http://127.0.0.1:8000/

The frontend is currently a dashboard UI scaffold.
Backend API integration is still in progress.

## 8. Backend Testing

Run the complete Django test suite:

```powershell
cd C:\OpsFlow\backend
python manage.py test
```

The existing backend test suite previously passed
59 tests.

Run the tests again after significant backend changes.

Do not assume tests pass after modifying models,
permissions, serializers or API views.

### Useful Django Commands

Check the project:

```powershell
python manage.py check
```

Show migration status:

```powershell
python manage.py showmigrations
```

Create an administrator account:

```powershell
python manage.py createsuperuser
```

Open Django admin:

http://127.0.0.1:8000/admin/

## 9. Frontend Build and Checks

From the frontend directory:

```powershell
cd C:\OpsFlow\frontend
```

Create a production build:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

Check available npm scripts:

```powershell
npm run
```

Run linting if a lint script is configured:

```powershell
npm run lint
```

If the script is not configured, inspect package.json
before attempting to add or install another tool.

## 10. API Development

The frontend will communicate with Django through
Axios and REST API endpoints.

Planned integration sequence:

1. Registration and login.
2. Current-user and logout endpoints.
3. Organization and project APIs.
4. Task management APIs.
5. Task comments and activity APIs.
6. Dashboard statistics using real data.

API requests should use a reusable API client and
service modules.

Before implementing an endpoint, inspect the existing
Django URL configuration, views and serializers.

Do not assume an endpoint exists without verifying it.

Use environment variables for frontend API configuration.

Do not put database credentials or Django secret keys
in frontend environment variables.

## 11. Development Workflow

Follow this workflow for every major feature:

1. Read the existing implementation.
2. Identify the relevant frontend and backend files.
3. Implement one feature at a time.
4. Run relevant backend tests.
5. Run frontend build or lint checks.
6. Verify functionality in the browser.
7. Review changes before committing.
8. Update PROJECT_STATUS.md after completing a full step.
9. Update ARCHITECTURE.md if the system architecture
   or technology decisions change.
10. Record major changes in CHANGELOG.md.

Keep changes focused and avoid modifying unrelated files.

## 12. Git Workflow

Check the current branch:

```powershell
git branch
```

Check working tree changes:

```powershell
git status
```

Review the changes:

```powershell
git diff
```

Stage selected files:

```powershell
git add <file-or-folder>
```

Create a descriptive commit:

```powershell
git commit -m "feat: describe completed feature"
```

Push the current branch:

```powershell
git push origin main
```

Before pushing, verify that secrets, local databases,
virtual environments and ignored documentation are
not included in the commit.

Never force-push or rewrite shared history without
a clear reason.

## 13. Git Ignore Rules

The following local development files should remain
excluded from version control:

- PROJECT_STATUS.md
- ARCHITECTURE.md
- .env files containing secrets.
- Python virtual environments.
- Node dependencies.
- Local database files.
- Generated build and cache files.

Check whether the local documentation is ignored:

```powershell
git check-ignore PROJECT_STATUS.md ARCHITECTURE.md
```

Expected output:

```text
PROJECT_STATUS.md
ARCHITECTURE.md
```

README.md, DEVELOPMENT.md, CHANGELOG.md and the docs
directory should remain available for version control.

## 14. Common Troubleshooting

### Backend: ModuleNotFoundError

Confirm the virtual environment is activated:

```powershell
..\.venv\Scripts\Activate.ps1
```

Then install the project's requirements:

```powershell
python -m pip install -r requirements.txt
```

### Backend: Database Connection Error

Check:
- Database service status.
- Active database engine in Django settings.
- Database name and connection settings.
- Environment variables.

Do not share database passwords in logs or screenshots.

### Backend: Migration Error

Check migration status:

```powershell
python manage.py showmigrations
```

Inspect model changes and migration files before
attempting to reset or delete migrations.

Do not delete production or development database
files to fix migration errors.

### Frontend: Dependency or Import Error

From the frontend directory:

```powershell
npm install
```

Check the import path and confirm the referenced
file exists with the correct filename and extension.

### Frontend: Port Already in Use

Vite may select another available port automatically.

Read the terminal output and open the exact URL
shown by Vite.

### Frontend: Backend API Not Responding

Confirm the Django development server is running.

Verify the API URL, CORS configuration, session
cookies and CSRF settings.

Check browser developer tools for network errors.

## 15. Current Development Status

The initial React dashboard and Django APIs have
been implemented.

The dashboard currently uses demo data.

Frontend authentication and API integration are
not yet complete.

Next development step:

Connect React authentication to Django, then integrate
projects, tasks, comments and activity APIs.

Replace demo data with real API responses and test
the complete frontend-backend workflow.

Update this guide whenever the actual setup or
development commands change.