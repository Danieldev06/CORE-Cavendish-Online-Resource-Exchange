import { useState, useEffect } from "react"
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Link2,
} from "lucide-react"
import { useApp } from "../context"
import { RESOURCE_TYPE_LABELS } from "../data"
import { PageHeader } from "../components/Layout"
import {
  api,
  resourceApi,
  lecturerApi,
  extractApiError,
  type Course,
} from "../services/api"

const LECTURER_TYPES = [
  "lecture-notes",
  "past-paper",
  "course-material",
  "academic-guide",
  "other",
]
const ADMIN_TYPES = Object.keys(RESOURCE_TYPE_LABELS)

// Map frontend resource type → backend resource_type enum
function toBackendType(frontendType: string): string {
  switch (frontendType) {
    case "lecture-notes":
      return "NOTES"
    case "past-paper":
      return "PASTPAPER"
    case "dissertation":
    case "thesis":
      return "DISSERTATION"
    case "course-material":
    case "academic-guide":
    case "research-proposal":
    case "research-paper":
    case "journal-article":
    case "other":
    default:
      return "ARTICLE"
  }
}

export default function UploadResource() {
  const { user, navigate, showToast } = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")

  // Course dropdown data from Django
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  const [form, setForm] = useState({
    title: "",
    type: "",
    course: "", // numeric course ID (as string)
    yearOfStudy: "", // 1–6
    semester: "", // 1–2
    description: "",
    keywords: "",
  })

  const update = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  // Load courses from Django on mount
  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) return

    if (user?.role === "lecturer") {
      // Lecturers only see their assigned courses
      lecturerApi
        .getMyCourses(token)
        .then((assignments) => setCourses(assignments.map((a) => a.course)))
        .catch((err) => console.error("Failed to load assigned courses:", err))
        .finally(() => setLoadingCourses(false))
    } else {
      // Admins see all courses
      api
        .getCourses()
        .then(setCourses)
        .catch((err) => console.error("Failed to load courses:", err))
        .finally(() => setLoadingCourses(false))
    }
  }, [user?.role])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  const canSubmit =
    form.title &&
    form.type &&
    form.course &&
    form.yearOfStudy &&
    form.semester &&
    form.description &&
    file

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!canSubmit || !file) return

    const token = localStorage.getItem("core_token")
    if (!token) {
      setError("Your session has expired. Please log in again.")
      return
    }

    setUploading(true)

    try {
      // Parse keywords from comma-separated string
      const keywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      await resourceApi.upload(
        {
          title: form.title,
          course: Number(form.course),
          year_of_study: Number(form.yearOfStudy),
          semester: Number(form.semester),
          resource_type: toBackendType(form.type),
          is_shared: user?.role === "admin",
          file,
          description: form.description,
          keywords,
        },
        token,
      )

      setSubmitted(true)
      showToast({ message: "Resource uploaded successfully!", type: "success" })
    } catch (err: any) {
      const msg = extractApiError(err)
      setError(msg)
      showToast({ message: `Upload failed: ${msg}`, type: "error" })
    } finally {
      setUploading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <PageHeader
          title="Upload Resource"
          breadcrumbs={[{ label: "Upload Resource" }]}
        />
        <div className="p-6 max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">
              Resource Uploaded
            </h2>
            <p className="text-navy-500 text-sm mb-6">
              Your resource has been uploaded and{" "}
              {user?.role === "admin" || user?.role === "lecturer"
                ? "published to"
                : "submitted to"}{" "}
              the repository.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  navigate(
                    user?.role === "lecturer"
                      ? "lecturer-resources"
                      : "admin-resources",
                  )
                }
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
              >
                View Resources
              </button>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setFile(null)
                  setForm({
                    title: "",
                    type: "",
                    course: "",
                    yearOfStudy: "",
                    semester: "",
                    description: "",
                    keywords: "",
                  })
                }}
                className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Upload Resource"
        subtitle="Upload academic resources to the repository."
        breadcrumbs={[{ label: "Upload Resource" }]}
      />
      <div className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resource details */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">
              Resource Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Full title of the resource"
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Resource Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
                >
                  <option value="">Select type...</option>
                  {(user?.role === "admin" ? ADMIN_TYPES : LECTURER_TYPES).map(
                    (t) => (
                      <option key={t} value={t}>
                        {
                          RESOURCE_TYPE_LABELS[
                            (t as keyof typeof RESOURCE_TYPE_LABELS)
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Course / Module <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.course}
                  onChange={(e) => update("course", e.target.value)}
                  disabled={loadingCourses || courses.length === 0}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition disabled:opacity-50"
                >
                  <option value="">
                    {loadingCourses
                      ? "Loading courses..."
                      : courses.length === 0
                        ? "No assigned courses — manage courses first"
                        : "Select course..."}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                {user?.role === "lecturer" &&
                  courses.length === 0 &&
                  !loadingCourses && (
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <Link2 size={12} />
                      <button
                        onClick={() => navigate("manage-courses")}
                        className="underline hover:text-amber-700"
                      >
                        Manage your course assignments
                      </button>
                    </p>
                  )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.yearOfStudy}
                  onChange={(e) => update("yearOfStudy", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
                >
                  <option value="">Year...</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.semester}
                  onChange={(e) => update("semester", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
                >
                  <option value="">Sem...</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & keywords */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">
              Description & Keywords
            </h3>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Describe the content, scope, and relevance of this resource..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                Keywords
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="Separate with commas: database, SQL, normalization..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
              />
            </div>
          </div>

          {/* File upload */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50 mb-4">
              Upload File <span className="text-red-500">*</span>
            </h3>
            {file ? (
              <div className="flex items-center gap-3 p-4 bg-navy-50 border border-navy-200 rounded-xl">
                <div className="w-10 h-10 bg-white border border-navy-200 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-navy-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-800 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-navy-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-navy-400 hover:text-red-500 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  dragOver
                    ? "border-navy-400 bg-navy-50"
                    : "border-navy-200 hover:border-navy-300"
                }`}
              >
                <Upload size={28} className="text-navy-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-navy-700 mb-1">
                  Drag and drop your file here
                </div>
                <div className="text-xs text-navy-400 mb-3">
                  Supported formats: PDF, DOCX, DOC · Max file size: 50 MB
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition">
                  <Upload size={14} /> Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!canSubmit && (form.title || form.type) && !error && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              Please complete all required fields and upload a file before
              submitting.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  user?.role === "lecturer"
                    ? "lecturer-dashboard"
                    : "admin-dashboard",
                )
              }
              className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || uploading}
              className="px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} /> Upload Resource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
