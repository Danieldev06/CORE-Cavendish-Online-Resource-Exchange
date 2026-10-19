import { useState, useEffect } from "react"
import {
  CheckSquare,
  Square,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { useApp } from "../context"
import { lecturerApi, extractApiError } from "../services/api"
import { PageHeader } from "../components/Layout"
import type { Course } from "../services/api"

export default function SelectCourses() {
  const { user, login, navigate, showToast } = useApp()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Verify user is a lecturer
  if (!user || user.role !== "lecturer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-center p-8">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            Access Denied
          </h2>
          <p className="text-navy-500">Only lecturers can access this page.</p>
          <button
            onClick={() => navigate("login")}
            className="mt-6 px-6 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) {
      setError("Session expired. Please log in again.")
      return
    }
    lecturerApi
      .getAvailableCourses(token)
      .then(setCourses)
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false))
  }, [])

  const toggleCourse = (courseId: number) => {
    setSelectedIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    )
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one course.")
      return
    }

    const token = localStorage.getItem("core_token")
    if (!token) {
      setError("Session expired. Please log in again.")
      return
    }

    setSaving(true)
    setError("")

    try {
      await lecturerApi.assignCourses(selectedIds, token)
      showToast({
        message: `${selectedIds.length} course(s) assigned successfully!`,
        type: "success",
      })
      navigate("lecturer-dashboard")
    } catch (err: any) {
      const msg = extractApiError(err)
      setError(msg)
      showToast({ message: `Failed to assign courses: ${msg}`, type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    showToast({
      message: "You can add courses later from your dashboard.",
      type: "info",
    })
    navigate("lecturer-dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-navy-600 animate-spin" />
          <div className="text-navy-600 font-medium">
            Loading available courses...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Select Courses You Teach"
        subtitle="Choose the modules you teach from your department. You can modify these later."
        breadcrumbs={[{ label: "Select Courses" }]}
      />
      <div className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">
              Available Courses ({courses.length})
            </h3>
            <span className="text-xs text-navy-500 bg-navy-50 px-2 py-1 rounded-full">
              {selectedIds.length} selected
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-10 text-navy-500">
              <Square size={32} className="text-navy-200 mx-auto mb-2" />
              <p>No available courses found in your department.</p>
              <p className="text-xs mt-1">
                Contact your administrator if this seems incorrect.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 max-h-[500px] overflow-y-auto">
              {courses.map((course) => (
                <label
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition cursor-pointer ${
                    selectedIds.includes(course.id)
                      ? "border-navy-500 bg-navy-50"
                      : "border-navy-100 hover:border-navy-300 hover:bg-navy-50"
                  }`}
                >
                  <div className="relative w-5 h-5 flex-shrink-0">
                    {selectedIds.includes(course.id) ? (
                      <CheckSquare size={20} className="text-navy-600" />
                    ) : (
                      <Square size={20} className="text-navy-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-800 text-sm">
                      {course.code} - {course.name}
                    </div>
                    <div className="text-[11px] text-navy-400">
                      {course.department_name} / {course.program_name}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
