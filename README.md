# Academic Institutional Repository

A Django REST API backend with a React frontend for managing academic resources (lecture notes, past papers, dissertations, articles) at Cavendish University.

## Features

### Backend (Django REST API)
- **Resource Management**: CRUD operations for academic resources with approval workflow
- **Department/Program/Course Hierarchy**: Organized faculty structure (Department → Program → Course → Resource)
- **Authentication**: Token-based auth with role support (student, lecturer, admin)
- **File Upload**: PDF/DOC/DOCX files stored on Cloudinary (50MB limit)
- **Search & Filtering**: By department, program, course, year, semester, type, keywords
- **Admin Panel**: Django admin for content moderation
- **Password Reset**: Email-based password reset flow
- **CORS Support**: Configured for React frontend (ports 8443, 5173)
- **Lecturer Course Assignment**: Lecturers select courses they teach; backend enforces department constraints and authorization on resource upload

### Frontend (React + Vite)
- **Role-based Dashboards**: Student, Lecturer, Admin views
- **Repository Browser**: Search, filter, paginated resource listing
- **Resource Detail View**: View/download with metadata
- **Submit Work**: Multi-step upload form with validation
- **My Submissions**: Track submission status and download counts
- **Admin Analytics**: Charts (Recharts) for submissions, downloads, users
- **Admin Users Management**: User listing with role/status
- **Admin Resources**: Approve/reject submissions
- **Auth Flow**: Login, Signup, Forgot Password, Password Reset
- **Notifications**: Toast + notification center
- **Bookmarks & Download History**: Local storage persistence
- **Responsive Layout**: Tailwind CSS with dark theme
- **Lecturer Course Management**: Two-step registration (account → course selection), self-service course assignment management

## Tech Stack

### Backend
| Category | Technology |
|----------|------------|
| Framework | Django 5.2.17 |
| API | Django REST Framework 3.18.1 |
| Auth | DRF TokenAuthentication + SessionAuthentication + BasicAuthentication |
| Database | SQLite (dev), PostgreSQL-ready (prod) |
| File Storage | Cloudinary (media), local (static) |
| CORS | django-cors-headers 4.9.0 |
| Validation | DRF Serializers |

### Frontend
| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5.7 |
| Routing | Custom context-based (ViewType enum) |
| State | React Context + localStorage |
| Charts | Recharts 3.10 |
| Icons | Lucide React |
| HTTP | Native fetch API |

## Prerequisites

- Python 3.10+
- Node.js 18+
- Cloudinary account (for media storage)

## Installation

### Backend

```bash
cd core_backend
python -m venv venv
# Windows
.\venv\Scripts\Activate.ps1
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional, for admin access
python manage.py runserver
```

Server runs at `http://127.0.0.1:8000/`

### Frontend

```bash
# From repository root
npm install
npm run dev
```

Frontend runs at `http://localhost:8443/` (or port shown in terminal)

## Configuration

### Environment Variables

Create `core_backend/.env` (not committed):

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (prod)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (prod)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
```

Current `settings.py` has hardcoded Cloudinary credentials — **replace with env vars before deploying**.

### CORS Origins

Configured in `coreapi/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8443",
    "http://127.0.0.1:8443",
    "http://localhost:5173",
]
```

### Frontend API Base URL

In `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

## Usage Examples

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/departments/` | List all departments | No |
| GET | `/api/programs/?department=<id>` | List programs (filter by dept) | No |
| GET | `/api/courses/?program=<id>` | List courses (filter by program) | No |
| GET | `/api/resources/` | List approved resources | No |
| GET | `/api/resources/<id>/` | Get resource detail | No |
| POST | `/api/auth/register/` | Register new user | No |
| POST | `/api/auth/login/` | Login, returns token | No |
| POST | `/api/auth/logout/` | Delete token | Yes |
| GET | `/api/auth/me/` | Get current user profile | Yes |
| POST | `/api/auth/password-reset/` | Request password reset | No |
| POST | `/api/auth/password-reset/confirm/` | Confirm password reset | No |
| POST | `/api/resources/create/` | Upload new resource | Yes |
| GET | `/api/resources/my-submissions/` | List user's uploads | Yes |
| GET | `/api/lecturer/courses/` | List lecturer's active course assignments | Lecturer |
| GET | `/api/lecturer/courses/available/` | List unassigned courses in lecturer's department | Lecturer |
| POST | `/api/lecturer/courses/assign/` | Assign courses to lecturer (bulk) | Lecturer |
| DELETE | `/api/lecturer/courses/<id>/` | Remove course assignment (soft delete) | Lecturer |
| GET/POST/DELETE | `/api/admin/lecturers/<id>/courses/` | Admin: manage any lecturer's courses | Admin |

### Query Parameters for `/api/resources/`

```
?department=<id|code>
&program=<id|code>
&programme=<name>
&course=<id|code>
&year=<1-6>
&semester=<1-2>
&type=<NOTES|PASTPAPER|DISSERTATION|ARTICLE>
&search=<keyword>
```

### Authentication

Include token in header:
```
Authorization: Token <your-token>
```

Token stored in `localStorage` as `core_token`.

### Example: Upload Resource

```bash
curl -X POST http://127.0.0.1:8000/api/resources/create/ \
  -H "Authorization: Token your-token" \
  -F "title=Lecture Notes Week 1" \
  -F "course=1" \
  -F "year_of_study=2" \
  -F "semester=1" \
  -F "resource_type=NOTES" \
  -F "file_pdf=@notes.pdf" \
  -F "is_shared=false" \
  -F "description=Introduction to algorithms" \
  -F 'keywords=["algorithms", "sorting", "week1"]'
```

## Lecturer Course Assignment Flow

### Registration (Two-Step)
1. **Step 1** — Lecturer registers with name, email, staff ID, role, password, department
2. **Step 2** — Redirected to `/select-courses` to choose modules from their department
3. **Auto-activation** — Selected courses become active immediately (no admin approval)

### Self-Service Management
- **View assignments** — `/manage-courses` shows active + historical assignments
- **Add courses** — Modal with available (unassigned) courses in department
- **Remove assignment** — Soft delete (sets `removed_date`), preserves audit trail

### Authorization
- **Frontend** — Course dropdown filtered to assigned courses only
- **Backend** — `create_resource` validates active `LecturerCourse` assignment (403 if unauthorized)

## Frontend Views & Routing

The app uses a custom `ViewType` enum (30 views) with context-based navigation:

### Public (No Auth)
- `login` — Email/password login
- `signup` — Registration with role selection
- `forgot-password` — Request password reset

### Student (role: student)
- `student-dashboard` — Overview with stats, recent resources
- `repository` — Browse/search all approved resources
- `resource-detail` — View resource metadata + download
- `submit-work` — Upload new resource (multi-step form)
- `my-submissions` — List own submissions with status
- `bookmarks` — Bookmarked resources
- `download-history` — Previously downloaded resources

### Lecturer (role: lecturer)
- `lecturer-dashboard` — Overview
- `lecturer-resources` — Resources for their courses
- `upload-resource` — Direct upload (filtered to assigned courses)
- `review-submissions` — Review pending submissions
- `review-submission-detail` — Detailed review view
- `select-courses` — Step 2 of registration: choose modules
- `manage-courses` — Add/remove course assignments

### Admin (role: admin)
- `admin-dashboard` — System overview
- `admin-resources` — Manage all resources (approve/reject)
- `admin-users` — User management
- `admin-analytics` — Charts (Recharts)
- `admin-collections` — Placeholder
- `admin-categories` — Placeholder
- `admin-activity` — Placeholder
- `admin-settings` — Placeholder

### Shared
- `research-repository` — Research-focused view
- `notifications` — Notification center
- `profile` — User profile

## Testing

### Backend

```bash
cd core_backend
# Run Django tests
python manage.py test repository
# Check migrations
python manage.py showmigrations
# Type check (if mypy installed)
mypy .
```

### Frontend

```bash
# Type checking
npx tsc --noEmit
# Format
npm run format
# Build
npm run build
```

## Deployment Notes

### Backend (Production)

1. Set `DEBUG=False` in settings
2. Use PostgreSQL: update `DATABASES` in settings
3. Set `SECRET_KEY` from environment
4. Configure `ALLOWED_HOSTS` with your domain
5. Use gunicorn + nginx:
   ```bash
   pip install gunicorn
   gunicorn coreapi.wsgi:application --bind 0.0.0.0:8000
   ```
6. Run `python manage.py collectstatic`
7. Use Cloudinary for media (already configured)
8. Set up proper email backend

### Frontend (Production)

```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or nginx
```

### Docker (Optional)

```dockerfile
# Backend
FROM python:3.10-slim
WORKDIR /app
COPY core_backend/requirements.txt .
RUN pip install -r requirements.txt
COPY core_backend/ .
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "coreapi.wsgi:application", "--bind", "0.0.0.0:8000"]

# Frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Project Structure

```
academic-institutional-repository/
├── core_backend/                    # Django project
│   ├── coreapi/                     # Project settings
│   │   ├── __init__.py
│   │   ├── asgi.py                  # ASGI entry point
│   │   ├── settings.py              # Main configuration
│   │   ├── urls.py                  # Root URL routing
│   │   └── wsgi.py                  # WSGI entry point
│   ├── repository/                  # Main app
│   │   ├── __init__.py
│   │   ├── admin.py                 # Admin registration (currently empty)
│   │   ├── apps.py                  # App configuration
│   │   ├── models.py                # Department, Program, Course, Resource, StudentProfile, LecturerCourse
│   │   ├── views.py                 # API views (FBV)
│   │   ├── serializers.py           # DRF serializers
│   │   ├── urls.py                  # App URL routes (/api/...)
│   │   ├── tests.py                 # Placeholder tests
│   │   ├── migrations/              # Database migrations (8 migrations)
│   │   └── management/              # Custom management commands
│   ├── media/                       # Local media files (dev only)
│   ├── venv/                        # Python virtual environment
│   ├── manage.py                    # Django CLI
│   ├── check_resources.py           # Debug script to inspect resources
│   ├── requirements.txt             # Production Python dependencies
│   └── requirements-dev.txt         # Development Python dependencies
├── src/                             # React frontend (Vite + TypeScript)
│   ├── components/                  # Reusable UI components
│   │   └── Layout.tsx               # Main layout with sidebar, header, toast
│   ├── services/                    # API service layer
│   │   └── api.ts                   # Fetch wrappers for all endpoints
│   ├── utils/                       # Utility functions (empty)
│   ├── views/                       # Page-level components (26 views)
│   │   ├── Login.tsx                # Login form
│   │   ├── Signup.tsx               # Registration with role selection
│   │   ├── ForgotPassword.tsx       # Password reset request/confirm
│   │   ├── SelectCourses.tsx        # Lecturer course selection (step 2)
│   │   ├── LecturerCourseManagement.tsx # Add/remove course assignments
│   │   ├── StudentDashboard.tsx     # Student overview
│   │   ├── RepositoryView.tsx       # Resource browser with filters
│   │   ├── ResourceDetail.tsx       # Resource detail + download
│   │   ├── SubmitWork.tsx           # Multi-step upload form
│   │   ├── MySubmissions.tsx        # User's submissions list
│   │   ├── LecturerDashboard.tsx    # Lecturer overview
│   │   ├── LecturerResources.tsx    # Lecturer's course resources
│   │   ├── UploadResource.tsx       # Direct upload (filtered to assigned)
│   │   ├── ReviewSubmissions.tsx    # Review pending submissions
│   │   ├── AdminDashboard.tsx       # Admin overview
│   │   ├── AdminResources.tsx       # Approve/reject resources
│   │   ├── AdminUsers.tsx           # User management table
│   │   ├── AdminAnalyticsView.tsx   # Charts (Recharts)
│   │   ├── ResearchRepository.tsx   # Research-focused view
│   │   ├── NotificationsView.tsx    # Notification center
│   │   ├── ProfileView.tsx          # User profile
│   │   ├── BookmarksView.tsx        # Bookmarked resources
│   │   ├── DownloadHistory.tsx      # Download history
│   │   └── PlaceholderViews.tsx     # Admin placeholder views
│   ├── context/                     # React context providers
│   │   └── context.tsx              # AppProvider + useApp hook
│   ├── App.tsx                      # Root component with routing
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles + Tailwind imports
│   ├── types.ts                     # TypeScript types (ViewType, Resource, User, etc.)
│   └── vite-env.d.ts                # Vite environment types
├── public/                          # Static assets
├── node_modules/                    # Frontend dependencies (excluded)
├── package.json                     # Frontend dependencies & scripts
├── package-lock.json                # npm lockfile
├── pnpm-lock.yaml                   # pnpm lockfile
├── vite.config.ts                   # Vite configuration (React, Tailwind, alias @)
├── tsconfig.json                    # TypeScript configuration
├── index.html                       # HTML template
├── .gitignore                       # Git ignore rules
├── .gitattributes                   # Git attributes
├── .mise.toml                       # Toolchain versions (Node, pnpm)
├── AGENTS.md                        # Agent instructions
├── CLAUDE.md                        # Claude instructions
├── README.md                        # This file
├── CHANGELOG.md                     # Version history
├── TREE.md                          # Directory tree
└── LICENSE                          # TODO: Add license file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes with clear commits
4. Run tests: `python manage.py test` (backend), `npx tsc --noEmit` (frontend)
5. Format code: `npm run format` (frontend)
6. Submit a pull request

## License

TODO: Add license (MIT, Apache 2.0, etc.)