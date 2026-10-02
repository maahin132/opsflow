# OpsFlow

> A production-style business operations management platform for teams, projects, tasks, and collaborative workflows.

OpsFlow is a full-stack SaaS platform built to bring day-to-day business operations into one organized workspace.

It combines organization management, role-based access control, projects, tasks, team collaboration, activity tracking, and a modern responsive interface backed by a Django REST API.

---

## ✦ Overview

OpsFlow is designed around a simple idea:

**One workspace. Clear ownership. Controlled access. Real operational data.**

The platform provides a structured environment where organizations can manage their teams and work while maintaining organization-level data isolation and role-based permissions.

The current implementation focuses on the core operational workflow:

- Authentication
- Organizations
- Team membership
- Projects
- Project members
- Tasks
- Task assignment
- Task status workflows
- Comments
- Activity tracking
- Team management
- Settings
- Role-based permissions

---

## 🚀 Current Status

**Core application: Completed**

| Area | Status |
|---|---|
| Django Backend | ✅ Complete |
| REST API | ✅ Complete |
| Session Authentication | ✅ Complete |
| Organization Management | ✅ Complete |
| Role-Based Permissions | ✅ Complete |
| Project Management | ✅ Complete |
| Task Management | ✅ Complete |
| Task Assignment | ✅ Complete |
| Comments & Activity | ✅ Complete |
| React Frontend | ✅ Complete |
| Frontend API Integration | ✅ Complete |
| Security / Permission Audit | ✅ Complete |
| Backend Tests | ✅ 79 / 79 Passing |
| Frontend Production Build | ✅ Passing |
| Production Deployment | ⏳ Pending |

---

## 🧩 Core Features

### 🔐 Authentication & Security

- User registration
- Session-based login
- Logout
- Current-user session validation
- CSRF protection
- Protected application routes
- Environment-based configuration
- Production security configuration

### 🏢 Organization Management

- Organization creation
- Organization membership
- Organization roles
- Member management
- Tenant-level data isolation

### 👥 Role-Based Access Control

OpsFlow currently supports:

- `OWNER`
- `ADMIN`
- `MANAGER`
- `EMPLOYEE`
- `MEMBER`

Permissions are enforced by the backend rather than relying only on frontend restrictions.

### 📁 Project Management

- Create projects
- Edit projects
- Delete projects
- Project details
- Project members
- Project-level access control
- Project archiving
- Organization-scoped projects

### ✅ Task Management

- Create tasks
- Edit tasks
- Delete tasks
- Assign tasks
- Task priorities
- Task statuses
- Start and due dates
- Completion tracking
- Task filtering
- Project-based task organization

### 💬 Collaboration

- Task comments
- Task activity history
- Workspace activity
- Activity-based Inbox
- Team member views

### 🎨 Modern Frontend

- Responsive React interface
- Dark / light theme
- Framer Motion animations
- Reusable UI components
- Protected routes
- Loading and empty states
- Permission-aware actions
- Real backend data

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | User interface |
| Vite | Frontend tooling |
| React Router DOM | Client-side routing |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Axios | API communication |
| Lucide React | Interface icons |

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend language |
| Django | Web framework |
| Django REST Framework | REST API |
| Django Session Authentication | Authentication |

### Database

**MySQL**

The backend uses Django ORM for database access and data modeling.

---

## 🏗 System Architecture

```text
                    ┌─────────────────────┐
                    │      User / Browser │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │   Frontend          │
                    └──────────┬──────────┘
                               │
                         Axios / REST
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Django REST API     │
                    │                     │
                    │ Authentication      │
                    │ Authorization       │
                    │ Validation          │
                    │ Business Logic      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MySQL         │
                    │      Database       │
                    └─────────────────────┘