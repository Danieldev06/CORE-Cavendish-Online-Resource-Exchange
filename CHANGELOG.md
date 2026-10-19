# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: Git history is not available. This changelog is reconstructed from the current codebase state.

## [Unreleased]

### Added

#### Backend
- Resource model extended with `description`, `keywords` (JSONField), and `file_size` fields
- Password reset endpoints (`/api/auth/password-reset/`, `/api/auth/password-reset/confirm/`)
- Role-based registration (student, lecturer, admin) with email domain validation (@cavendish.ac.zm, @students.cavendish.ac.zm, @cavendish.co.zm, @students.cavendish.co.zm)
- File upload validation (50MB limit, PDF/DOC/DOCX only)
- Cloudinary integration for media file storage
- CORS configuration for React frontend (ports 8443, 5173)
- StudentProfile model with role, department, program, and year fields
- Resource download count tracking
- Resource approval workflow (is_approved, approved_by, approved_date)
- Cross-faculty sharing flag (`is_shared`)
- Django admin panel ready (models registered in admin.py placeholder)
- **LecturerCourse model** — explicit many-to-many with history tracking (assigned_date, assigned_by, removed_date, removed_by)
- **Department FK on Course** — denormalized for performance and direct dept lookup
- **Lecturer course assignment endpoints**:
  - `GET /api/lecturer/courses/` — active assignments
  - `GET /api/lecturer/courses/available/` — unassigned courses in department
  - `POST /api/lecturer/courses/assign/` — bulk assign (validates dept match)
  - `DELETE /api/lecturer/courses/<id>/` — soft delete (sets removed_date)
  - `GET/POST/DELETE /api/admin/lecturers/<id>/courses/` — admin full management
- **Resource upload authorization** — backend validates active LecturerCourse assignment (403 if unauthorized)

#### Frontend
- Role-based routing with 30 ViewTypes (student, lecturer, admin, shared)
- Authentication flow: Login, Signup, Forgot Password, Password Reset Confirm
- Token persistence in localStorage (`core_token`) with auto-restore on load
- Student Dashboard: stats cards, recent resources, quick actions
- Repository View: searchable, filterable resource grid with pagination
- Resource Detail: metadata display, download button, bookmark toggle
- Submit Work: 3-step wizard (details → file → confirm) with validation
- My Submissions: status badges (pending/approved/rejected), download counts
- Lecturer Dashboard + Resources + Upload + Review Submissions
- Admin Dashboard + Resources (approve/reject) + Users table + Analytics (Recharts)
- Admin placeholder views: Collections, Categories, Activity, Settings
- Research Repository view
- Notifications center with read/unread states
- Profile view with editable fields
- Bookmarks + Download History (localStorage persistence)
- Toast notifications (auto-dismiss, success/error/info)
- Responsive Layout with sidebar navigation, mobile drawer
- Tailwind CSS v4 dark theme (navy-950 background)
- TypeScript types for all API responses and app state
- **Lecturer two-step registration**:
  - Step 1: Account creation (name, email, staff ID, role, department)
  - Step 2: Course selection (`/select-courses`) — filtered by department
  - Auto-redirect to dashboard after assignment
- **Lecturer course management** (`/manage-courses`):
  - Active assignments list with remove (soft delete)
  - Add courses modal with available (unassigned) courses
  - Historical assignments with dates (audit trail)
- **UploadResource** — course dropdown filtered to lecturer's active assignments

### Changed
- Updated Django from 6.1 to 5.2.17 (settings.py comment was outdated)
- REST Framework default permissions changed to `AllowAny` for public API access
- Authentication supports Token, Session, and Basic auth
- File upload path uses date-based directories (`resources/%Y/%m/%d/`)
- Frontend uses custom context-based routing instead of React Router
- API base URL configurable in `src/services/api.ts`
- **Signup programs API** — now uses department ID (numeric) instead of code
- **UploadResource** — lecturers see only assigned courses; link to manage courses if none

### Fixed
- Virtual environment path configuration corrected
- venv relocated to `core_backend/venv/` for standard Django project structure
- Frontend auth loading state prevents flash of login screen
- CORS headers allow credentials for token auth
- **SelectCourses** — missing onClick handlers on course rows (selection now works)
- **LecturerCourseManagement** — missing onClick handlers in add modal (selection now works)
- **Signup programs** — department code correctly mapped to ID for API call

## [0.1.0] - 2024-09-15

### Added
- Initial Django project setup (`coreapi`)
- Repository app with models: Department, Program, Course, Resource
- Django REST Framework API endpoints for all models
- Token-based authentication (register, login, logout, me)
- Basic serializer layer
- SQLite database configuration
- Django admin integration
- Initial migration (0001_initial)

### Changed
- Department model: added `code` field (migration 0002)
- StudentProfile model: added `role` field with choices (migration 0003)
- Resource model: added `description`, `keywords`, `file_size` fields (migration 0004)

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Secret key and Cloudinary credentials currently hardcoded in settings.py — must be moved to environment variables before production deployment
- Password reset tokens returned in API response (for testing) — should be emailed in production
- `ALLOWED_HOSTS = ['*']` in development — restrict in production