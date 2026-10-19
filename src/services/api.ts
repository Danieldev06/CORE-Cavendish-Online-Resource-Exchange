// src/services/api.ts

const API_BASE_URL = "http://localhost:8000/api"

// ============================================================

// TYPES

// ============================================================

export interface Resource {
  id: number

  title: string

  course: number

  course_code?: string

  course_name?: string

  year_of_study: number

  semester: number

  resource_type: string

  file_pdf: string

  uploaded_by: number

  uploaded_by_username?: string

  uploaded_by_name: string

  is_approved: boolean

  is_shared: boolean

  upload_date: string

  download_count: number

  // New fields from updated serializer

  description?: string

  keywords?: string[]

  file_size?: number

  department_name?: string

  program_name?: string
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

export interface AuthUser {
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

  profile_image?: string
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

export interface AuthResponse {
  token: string

  user: AuthUser
}

export interface Notification {
  id: string

  userId: string

  title: string

  message: string

  type: "info" | "success" | "warning" | "error"

  read: boolean

  date: string

  actionView?: string

  actionParams?: Record<string, string>
}

export interface UploadResourcePayload {
  title: string

  course: number

  year_of_study: number

  semester: number

  resource_type: string

  is_shared: boolean

  file: File

  description?: string

  keywords?: string[]
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

// ============================================================

// ERROR HELPER

// ============================================================

/**
 * Extracts a human-readable error message from various
 * Django DRF error shapes (dict, string, nested arrays).
 */

export function extractApiError(err: any): string {
  if (!err) return "Something went wrong."

  // If it's a raw string

  if (typeof err === "string") return err

  // If it's an Error object with a JSON message

  const raw = err.message ?? err

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw

    if (typeof parsed === "object") {
      return Object.entries(parsed)

        .map(([field, errors]) => {
          const msg = Array.isArray(errors) ? errors.join(", ") : String(errors)

          return field === "non_field_errors" || field === "error"
            ? msg
            : `${field}: ${msg}`
        })

        .join(" | ")
    }

    return String(parsed)
  } catch {
    return String(raw)
  }
}

// ============================================================

// DATA API (Public endpoints)

// ============================================================

export interface ResourceFilters {
  type?: string

  course?: string

  programme?: string

  year?: string

  semester?: string

  search?: string

  department?: string

  program?: string
}

export const api = {
  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.type) params.append("type", filters.type)

      if (filters.course) params.append("course", filters.course)

      if (filters.programme) params.append("programme", filters.programme)

      if (filters.year) params.append("year", filters.year)

      if (filters.semester) params.append("semester", filters.semester)

      if (filters.search) params.append("search", filters.search)

      if (filters.department) params.append("department", filters.department)

      if (filters.program) params.append("program", filters.program)
    }

    const queryString = params.toString()

    const url = `${API_BASE_URL}/resources/${
      queryString ? `?${queryString}` : ""
    }`

    const response = await fetch(url)

    if (!response.ok) throw new Error("Failed to fetch resources")

    return response.json()
  },

  async getDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/`)

    if (!response.ok) throw new Error("Failed to fetch departments")

    return response.json()
  },

  async getPrograms(departmentId?: number | string): Promise<Program[]> {
    const url = departmentId
      ? `${API_BASE_URL}/programs/?department=${departmentId}`
      : `${API_BASE_URL}/programs/`

    const response = await fetch(url)

    if (!response.ok) throw new Error("Failed to fetch programs")

    return response.json()
  },

  async getCourses(programId?: number): Promise<Course[]> {
    const url = programId
      ? `${API_BASE_URL}/courses/?program=${programId}`
      : `${API_BASE_URL}/courses/`

    const response = await fetch(url)

    if (!response.ok) throw new Error("Failed to fetch courses")

    return response.json()
  },

  async getResource(id: number): Promise<Resource> {
    const response = await fetch(`${API_BASE_URL}/resources/${id}/`)

    if (!response.ok) throw new Error("Failed to fetch resource")

    return response.json()
  },

  async getAdminUsers(token: string): Promise<AdminUser[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch users")

    return response.json()
  },

  async updateAdminUser(
    token: string,
    userId: number,
    data: Partial<Pick<AdminUser, "first_name" | "last_name" | "email" | "status">>,
  ): Promise<AdminUser> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(json))
    return json
  },

  // Admin Resource Management
  async getAdminResources(
    token: string,
    filters?: {
      search?: string
      type?: string
      status?: string
      school?: string
      page?: number
      page_size?: number
    }
  ): Promise<{
    results: Resource[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> {
    const params = new URLSearchParams()
    if (filters) {
      if (filters.search) params.append('search', filters.search)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.school) params.append('school', filters.school)
      if (filters.page) params.append('page', String(filters.page))
      if (filters.page_size) params.append('page_size', String(filters.page_size))
    }
    const queryString = params.toString()
    const url = `${API_BASE_URL}/admin/resources/${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch admin resources")

    return response.json()
  },

  async adminResourceAction(
    token: string,
    resourceId: number,
    action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'delete'
  ): Promise<{ message: string; resource?: Resource }> {
    const response = await fetch(`${API_BASE_URL}/admin/resources/${resourceId}/action/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    })

    const json = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  async adminResourceUpdate(
    token: string,
    resourceId: number,
    data: Partial<Resource>
  ): Promise<Resource> {
    const response = await fetch(`${API_BASE_URL}/admin/resources/${resourceId}/update/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const json = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  async getNotifications(token: string, unreadOnly?: boolean): Promise<Notification[]> {
    const params = new URLSearchParams()
    if (unreadOnly) params.append('unread_only', 'true')
    const queryString = params.toString()
    const response = await fetch(`${API_BASE_URL}/notifications/${queryString ? `?${queryString}` : ''}`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch notifications")

    return response.json()
  },

  async markNotificationRead(token: string, id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to mark notification as read")
  },

  async markAllNotificationsRead(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to mark all notifications as read")
  },

  async deleteNotification(token: string, id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to delete notification")
  },

  async deleteAllNotifications(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/clear/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to delete notifications")
  },
}

// ============================================================

// AUTH API

// ============================================================

export const authApi = {
  async register(data: {
    first_name: string

    last_name: string

    email: string

    student_id: string

    faculty: string

    program: string

    year: string

    role: string

    password: string
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(data),
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ email, password }),
    })

    const json = await response.json()

    if (!response.ok) throw new Error(json.error || "Login failed")

    return json
  },

  async logout(token: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",

      headers: { Authorization: `Token ${token}` },
    })
  },

  async me(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Not authenticated")

    return response.json()
  },

  async uploadProfileImage(token: string, image: File): Promise<AuthUser> {
    const formData = new FormData()
    formData.append("profile_image", image)
    const response = await fetch(`${API_BASE_URL}/auth/profile-image/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
      body: formData,
    })
    const json = await response.json()
    if (!response.ok) throw new Error(JSON.stringify(json))
    return json
  },

  // Password Reset

  async passwordResetRequest(email: string): Promise<{
    message: string
    uid: string
    token: string
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ email }),
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  async passwordResetConfirm(
    uid: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/auth/password-reset/confirm/`,
      {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
          confirm_password: newPassword,
        }),
      },
    )

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },
}

// ============================================================

// RESOURCE UPLOAD API (Authenticated)

// ============================================================

export const resourceApi = {
  /**
   * Upload a new resource. Requires a valid auth token.
   */

  async upload(
    payload: UploadResourcePayload,
    token: string,
  ): Promise<Resource> {
    const formData = new FormData()

    formData.append("title", payload.title)

    formData.append("course", String(payload.course))

    formData.append("year_of_study", String(payload.year_of_study))

    formData.append("semester", String(payload.semester))

    formData.append("resource_type", payload.resource_type)

    formData.append("is_shared", payload.is_shared ? "true" : "false")

    formData.append("file_pdf", payload.file)

    if (payload.description) formData.append("description", payload.description)

    if (payload.keywords)
      formData.append("keywords", JSON.stringify(payload.keywords))

    const response = await fetch(`${API_BASE_URL}/resources/create/`, {
      method: "POST",

      headers: { Authorization: `Token ${token}` },

      body: formData,
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Update an existing resource. Requires a valid auth token.
   */

  async update(
    resourceId: number,
    payload: Partial<UploadResourcePayload>,
    token: string,
  ): Promise<Resource> {
    const formData = new FormData()

    if (payload.title) formData.append("title", payload.title)

    if (payload.course) formData.append("course", String(payload.course))

    if (payload.year_of_study)
      formData.append("year_of_study", String(payload.year_of_study))

    if (payload.semester) formData.append("semester", String(payload.semester))

    if (payload.resource_type)
      formData.append("resource_type", payload.resource_type)

    if (payload.is_shared !== undefined)
      formData.append("is_shared", payload.is_shared ? "true" : "false")

    if (payload.file) formData.append("file_pdf", payload.file)

    if (payload.description) formData.append("description", payload.description)

    if (payload.keywords)
      formData.append("keywords", JSON.stringify(payload.keywords))

    const response = await fetch(
      `${API_BASE_URL}/resources/${resourceId}/update/`,
      {
        method: "PATCH",

        headers: { Authorization: `Token ${token}` },

        body: formData,
      },
    )

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Get the current lecturer's uploaded resources.
   */

  async getLecturerResources(token: string): Promise<Resource[]> {
    const response = await fetch(`${API_BASE_URL}/lecturer/resources/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch resources")

    return response.json()
  },

  /**
   * Delete a resource. Requires a valid auth token.
   */

  async delete(resourceId: number, token: string): Promise<{
    message: string
  }> {
    const response = await fetch(
      `${API_BASE_URL}/resources/${resourceId}/delete/`,
      {
        method: "DELETE",

        headers: { Authorization: `Token ${token}` },
      },
    )

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Download a resource (increments count, returns secure file URL).
   */
  async download(resourceId: number, token: string): Promise<{
    file_url: string
    download_count: number
  }> {
    const response = await fetch(
      `${API_BASE_URL}/resources/${resourceId}/download/`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Get secure file URL for preview.
   */
  async getFileUrl(resourceId: number, token: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/resources/${resourceId}/download/`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json.file_url
  },
}

// ============================================================

// STUDENT API

// ============================================================

export const studentApi = {
  /**
   * Get courses in the current student's program.
   * Requires a valid auth token.
   */

  async getMyCourses(token: string): Promise<Course[]> {
    const response = await fetch(`${API_BASE_URL}/student/courses/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch your courses")

    return response.json()
  },
}

// ============================================================

// LECTURER COURSE MANAGEMENT API

// ============================================================

export const lecturerApi = {
  /**
   * Get the current lecturer's active course assignments.
   */

  async getMyCourses(token: string): Promise<LecturerCourse[]> {
    const response = await fetch(`${API_BASE_URL}/lecturer/courses/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch assigned courses")

    return response.json()
  },

  /**
   * Get courses in the lecturer's department that are not yet assigned.
   */

  async getAvailableCourses(token: string): Promise<Course[]> {
    const response = await fetch(
      `${API_BASE_URL}/lecturer/courses/available/`,
      {
        headers: { Authorization: `Token ${token}` },
      },
    )

    if (!response.ok) throw new Error("Failed to fetch available courses")

    return response.json()
  },

  /**
   * Assign courses to the current lecturer (bulk).
   */

  async assignCourses(
    courseIds: number[],
    token: string,
  ): Promise<LecturerCourse[]> {
    const response = await fetch(`${API_BASE_URL}/lecturer/courses/assign/`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Token ${token}`,
      },

      body: JSON.stringify({ course_ids: courseIds }),
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Remove a course assignment.
   */

  async removeCourse(assignmentId: number, token: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/lecturer/courses/${assignmentId}/`,
      {
        method: "DELETE",

        headers: { Authorization: `Token ${token}` },
      },
    )

    if (!response.ok) {
      const json = await response.json()

      throw new Error(JSON.stringify(json))
    }
  },
}

// ============================================================

// SUBMISSION API

// ============================================================

export interface SubmissionPayload {
  title: string

  abstract: string

  keywords: string[]

  file: File

  resource_type: string

  course: number

  year_of_study: number

  semester: number

  academic_year: string
}

export interface ReviewDecision {
  decision: "approve" | "reject" | "revision_requested"

  comments: string
}

export const submissionApi = {
  /**
   * List submissions for the current lecturer's assigned courses.
   */

  async list(token: string): Promise<Submission[]> {
    const response = await fetch(`${API_BASE_URL}/submissions/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch submissions")

    return response.json()
  },

  /**
   * Student submits new work for review.
   */

  async create(payload: SubmissionPayload, token: string): Promise<Submission> {
    const formData = new FormData()

    formData.append("title", payload.title)

    formData.append("abstract", payload.abstract)

    formData.append("keywords", JSON.stringify(payload.keywords))

    formData.append("file_pdf", payload.file)

    formData.append("resource_type", payload.resource_type)

    formData.append("course", String(payload.course))

    formData.append("year_of_study", String(payload.year_of_study))

    formData.append("semester", String(payload.semester))

    formData.append("academic_year", payload.academic_year)

    const response = await fetch(`${API_BASE_URL}/submissions/create/`, {
      method: "POST",

      headers: { Authorization: `Token ${token}` },

      body: formData,
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Get the current student's submissions.
   */

  async getMySubmissions(token: string): Promise<Submission[]> {
    const response = await fetch(`${API_BASE_URL}/submissions/my/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch submissions")

    return response.json()
  },

  /**
   * Get submission detail.
   */

  async getDetail(id: number, token: string): Promise<Submission> {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/`, {
      headers: { Authorization: `Token ${token}` },
    })

    if (!response.ok) throw new Error("Failed to fetch submission")

    return response.json()
  },

  /**
   * Lecturer reviews a submission.
   */

  async review(
    id: number,
    decision: ReviewDecision,
    token: string,
  ): Promise<Submission> {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/review/`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Token ${token}`,
      },

      body: JSON.stringify(decision),
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },

  /**
   * Delete a submission. Requires a valid auth token.
   */

  async delete(id: number, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/delete/`, {
      method: "DELETE",

      headers: { Authorization: `Token ${token}` },
    })

    const json = await response.json()

    if (!response.ok) throw new Error(JSON.stringify(json))

    return json
  },
}

export default api
