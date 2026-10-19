# Project Tree

Maximum depth: 3
Excluded: `.git`, `node_modules`, `venv`, `__pycache__`, `dist`, `build`, `.env`, `*.pyc`, `db.sqlite3`

```
academic-institutional-repository/
├── core_backend/                    # Django backend project
│   ├── coreapi/                     # Project configuration
│   │   ├── __init__.py
│   │   ├── asgi.py                  # ASGI entry point
│   │   ├── settings.py              # Main settings (DB, auth, CORS, Cloudinary, DRF)
│   │   ├── urls.py                  # Root URL configuration
│   │   └── wsgi.py                  # WSGI entry point
│   ├── repository/                  # Main Django app
│   │   ├── __init__.py
│   │   ├── admin.py                 # Admin registration (currently empty)
│   │   ├── apps.py                  # App configuration
│   │   ├── models.py                # Data models (Department, Program, Course, Resource, StudentProfile, LecturerCourse)
│   │   ├── views.py                 # API views (function-based)
│   │   ├── serializers.py           # DRF serializers
│   │   ├── urls.py                  # App URL routes (/api/...)
│   │   ├── tests.py                 # Placeholder tests
│   │   ├── migrations/              # Database migrations
│   │   │   ├── __init__.py
│   │   │   ├── 0001_initial.py
│   │   │   ├── 0002_department_code.py
│   │   │   ├── 0003_studentprofile_role.py
│   │   │   ├── 0004_resource_description_resource_file_size_and_more.py
│   │   │   ├── 0005_course_department_lecturercourse.py
│   │   │   ├── 0006_populate_course_department.py
│   │   │   └── 0007_make_course_department_required.py
│   │   └── management/              # Custom management commands
│   │       └── __init__.py
│   ├── media/                       # Local media files (development only)
│   ├── venv/                        # Python virtual environment (excluded)
│   ├── manage.py                    # Django management script
│   ├── check_resources.py           # Debug script to inspect resources
│   ├── requirements.txt             # Production Python dependencies
│   └── requirements-dev.txt         # Development Python dependencies
├── src/                             # React frontend (Vite + TypeScript)
│   ├── components/                  # Reusable UI components
│   │   └── Layout.tsx               # Main layout: sidebar, header, toast, responsive nav
│   ├── services/                    # API service layer
│   │   └── api.ts                   # Fetch wrappers: data, auth, resource upload, lecturer course APIs
│   ├── utils/                       # Utility functions (empty)
│   ├── views/                       # Page-level components (26 views)
│   │   ├── Login.tsx                # Login form with email/password
│   │   ├── Signup.tsx               # Registration with role selection (student/lecturer/admin)
│   │   ├── ForgotPassword.tsx       # Password reset request + confirm flow
│   │   ├── SelectCourses.tsx        # Lecturer course selection (registration step 2)
│   │   ├── LecturerCourseManagement.tsx # Add/remove course assignments (self-service)
│   │   ├── StudentDashboard.tsx     # Student overview: stats, recent resources, quick actions
│   │   ├── RepositoryView.tsx       # Resource browser with search, filters, pagination
│   │   ├── ResourceDetail.tsx       # Resource detail view with metadata + download
│   │   ├── SubmitWork.tsx           # Multi-step upload form (title, course, file, metadata)
│   │   ├── MySubmissions.tsx        # User's submissions with status badges
│   │   ├── LecturerDashboard.tsx    # Lecturer overview
│   │   ├── LecturerResources.tsx    # Resources for lecturer's assigned courses
│   │   ├── UploadResource.tsx       # Direct resource upload (filtered to assigned courses)
│   │   ├── ReviewSubmissions.tsx    # Review queue: approve/reject with feedback
│   │   ├── AdminDashboard.tsx       # Admin system overview
│   │   ├── AdminResources.tsx       # Manage all resources (approve/reject/delete)
│   │   ├── AdminUsers.tsx           # User management table with role/status
│   │   ├── AdminAnalyticsView.tsx   # Analytics charts (Recharts): submissions, downloads, users
│   │   ├── ResearchRepository.tsx   # Research-focused resource view
│   │   ├── NotificationsView.tsx    # Notification center (read/unread, actions)
│   │   ├── ProfileView.tsx          # User profile with editable fields
│   │   ├── BookmarksView.tsx        # Bookmarked resources (localStorage)
│   │   ├── DownloadHistory.tsx      # Download history (localStorage)
│   │   └── PlaceholderViews.tsx     # Admin placeholders: collections, categories, activity, settings
│   ├── context/                     # React context providers
│   │   └── context.tsx              # AppProvider: auth state, navigation, notifications, bookmarks, downloads, toast, lecturer courses
│   ├── App.tsx                      # Root component with view-based routing (30 ViewTypes)
│   ├── main.tsx                     # Application entry point
│   ├── index.css                    # Global styles + Tailwind CSS v4 imports
│   ├── types.ts                     # TypeScript type definitions (User, Resource, ViewType, ResourceStatus, ResourceType, LecturerCourse, etc.)
│   └── vite-env.d.ts                # Vite environment type declarations
├── public/                          # Static assets served directly
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
├── README.md                        # Project documentation
├── CHANGELOG.md                     # Version history
├── TREE.md                          # This file
└── LICENSE                          # TODO: Add license file
```