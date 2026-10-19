export type UserRole = "student" | "lecturer" | "admin"

export type ViewType = "login" | "signup" | "forgot-password" | "select-courses" | "student-dashboard" | "repository" | "resource-detail" | "submit-work" | "my-submissions" | "bookmarks" | "download-history" | "lecturer-dashboard" | "lecturer-resources" | "upload-resource" | "review-submissions" | "review-submission-detail" | "admin-dashboard" | "admin-resources" | "admin-users" | "research-repository" | "admin-collections" | "admin-categories" | "admin-analytics" | "admin-activity" | "admin-settings" | "notifications" | "profile" | "manage-courses"

export type ResourceStatus = "draft" | "submitted" | "under-review" | "approved" | "rejected" | "published" | "archived"

export type ResourceType = "lecture-notes" | "past-paper" | "dissertation" | "thesis" | "research-proposal" | "journal-article" | "research-paper" | "course-material" | "academic-guide" | "other"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  studentId?: string
  staffId?: string
  programme?: string
  department?: string
  school?: string
  yearOfStudy?: number
  status: "active" | "inactive"
  dateJoined: string
  profileImage?: string
  submissionsCount?: number
  downloadsCount?: number
  bookmarksCount?: number
}

export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: "student" | "lecturer" | "admin"
  faculty: string
  program: string
  year: number
  student_id: string
  staff_id?: string
  status: "active" | "inactive"
  date_joined: string
  submissions_count: number
  downloads_count: number
  bookmarks_count: number
}

export interface Department {
  id: number
  name: string
  code: string
}

export interface Program {
  id: number
  name: string
  code: string
  department: number
  department_name?: string
}

export interface Course {
  id: number
  code: string
  name: string
  program: number
  program_name?: string
  department: number
  department_name?: string
  department_code?: string
}

export interface LecturerCourse {
  id: number
  course: Course
  assigned_date: string
  assigned_by: number
  removed_date: string | null
  removed_by: number | null
  is_active: boolean
}

export interface Resource {
  id: string
  title: string
  type: ResourceType
  author: string
  authorId: string
  school: string
  programme: string
  course?: string
  courseCode?: string
  academicYear: string
  dateUploaded: string
  fileType: string
  fileSize: string
  description: string
  keywords: string[]
  status: ResourceStatus
  downloads: number
  views: number
  abstract?: string
}

export type SubmissionStatus = "submitted" | "under_review" | "approved" | "rejected" | "revision_requested" | "published"

export interface Submission {
  id: number
  title: string
  abstract: string
  keywords: string[]
  file_pdf: string
  file_size: number
  resource_type: string
  course: number
  course_code?: string
  course_name?: string
  year_of_study: number
  semester: number
  academic_year: string
  status: SubmissionStatus
  student: number
  student_name?: string
  student_email?: string
  reviewer?: number
  reviewer_name?: string
  review_comments?: string
  reviewed_date?: string
  submitted_date: string
  updated_date: string
  resource?: number
  department_name?: string
  program_name?: string
}

export interface Notification {
  id: string | number
  userId: string | number
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  date: string
  actionView?: ViewType
  actionParams?: Record<string, string>
}

export interface AppContextType {
  user: User | null
  currentView: ViewType
  params: Record<string, string>
  navigate: (view: ViewType, params?: Record<string, string>) => void
  updateUser: (user: User) => void
  login: (user: User, token?: string, redirectTo?: ViewType) => void
  logout: () => void | Promise<void>
  notifications: Notification[]
  markNotificationRead: (id: string | number) => void
  markAllRead: () => void
  deleteNotification: (id: string | number) => void
  deleteAllNotifications: () => void
  bookmarkedIds: string[]
  toggleBookmark: (id: string) => void
  downloadedIds: string[]
  addDownload: (id: string) => void
  toast: ToastMessage | null
  showToast: (msg: ToastMessage) => void
  dismissToast: () => void
  lecturerCourses: LecturerCourse[]
}

export interface ToastMessage {
  message: string
  type: "success" | "error" | "info"
}
