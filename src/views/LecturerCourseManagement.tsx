import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
} from "lucide-react"
import { useApp } from "../context"
import {
  lecturerApi,
  extractApiError,
  type Course,
  type LecturerCourse,
} from "../services/api"
import { PageHeader } from "../components/Layout"

export default function LecturerCourseManagement() {
  const { user, showToast } = useApp()
  const [activeAssignments, setActiveAssignments] = useState<LecturerCourse[]>(
    [],
  )
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([])
  const [error, setError] = useState("")

  const token = localStorage.getItem("core_token")

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [myCourses, available] = await Promise.all([
        lecturerApi.getMyCourses(token),
        lecturerApi.getAvailableCourses(token),
      ])
      setActiveAssignments(myCourses)
      setAvailableCourses(available)
    } catch (err: any) {
      setError(extractApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const toggleAddSelection = (courseId: number) => {
    setSelectedToAdd((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    )
  }

  const handleAddCourses = async () => {
    if (selectedToAdd.length === 0 || !token) return
    setAdding(true)
    setError("")
    try {
      await lecturerApi.assignCourses(selectedToAdd, token)
      showToast({
        message: `${selectedToAdd.length} course(s) added!`,
        type: "success",
      })
      setShowAddModal(false)
      setSelectedToAdd([])
      loadData()
    } catch (err: any) {
      const msg = extractApiError(err)
      setError(msg)
      showToast({ message: `Failed to add courses: ${msg}`, type: "error" })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (assignmentId: number) => {
    if (!token) return
    if (
      !window.confirm(
        "Remove this course assignment? You will no longer be able to upload resources for this course.",
      )
    )
      return

    setRemoving(assignmentId)
    try {
      await lecturerApi.removeCourse(assignmentId, token)
      showToast({
        message: "Course removed from your assignments.",
        type: "success",
      })
      loadData()
    } catch (err: any) {
      const msg = extractApiError(err)
      showToast({ message: `Failed to remove course: ${msg}`, type: "error" })
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="text-navy-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Manage My Courses"
        subtitle="Add or remove courses you teach. Only assigned courses can be used for resource uploads."
        breadcrumbs={[
          { label: "Lecturer Dashboard", view: "lecturer-dashboard" },
          { label: "Manage Courses" },
        ]}
      />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Active Assignments */}
        <div className="bg-white rounded-xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
            <h3 className="font-semibold text-navy-800 flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-600" />
              Active Assignments ({activeAssignments.length})
            </h3>
            {availableCourses.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <Plus size={14} /> Add Courses
              </button>
            )}
          </div>

          {activeAssignments.length === 0 ? (
            <div className="p-10 text-center text-navy-500">
              <Square size={32} className="text-navy-200 mx-auto mb-2" />
              <p className="font-medium">No active course assignments</p>
              <p className="text-xs mt-1">
                Add courses to enable resource uploads
              </p>
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-navy-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-800 text-sm">
                      {assignment.course.code} - {assignment.course.name}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-navy-400 mt-0.5">
                      <span>
                        {assignment.course.department_name} /{" "}
                        {assignment.course.program_name}
                      </span>
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                      <span>
                        Assigned{" "}
                        {new Date(
                          assignment.assigned_date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(assignment.id)}
                    disabled={removing === assignment.id}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Remove assignment"
                  >
                    {removing === assignment.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Removed/Historical Assignments */}
        <div className="bg-white rounded-xl border border-navy-100 shadow-sm">
          <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
            <button
              onClick={() => {
                /* Could expand/collapse */
              }}
              className="font-semibold text-navy-800 flex items-center gap-2"
            >
              <Clock size={18} className="text-amber-600" />
              Historical Assignments
            </button>
          </div>
          <div className="px-5 py-4 text-center text-navy-500 text-sm">
            Historical tracking shows removed assignments with dates. This data
            is retained for audit purposes.
          </div>
        </div>
      </div>

      {/* Add Courses Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
              <h3 className="font-semibold text-navy-800">Add Courses</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedToAdd([])
                }}
                className="p-1 text-navy-400 hover:text-navy-600"
              >
                <ChevronDown size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {availableCourses.length === 0 ? (
                <div className="text-center py-10 text-navy-500">
                  <CheckSquare
                    size={32}
                    className="text-navy-200 mx-auto mb-2"
                  />
                  <p>All courses in your department are already assigned.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCourses.map((course) => (
                    <label
                      key={course.id}
                      onClick={() => toggleAddSelection(course.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition cursor-pointer ${
                        selectedToAdd.includes(course.id)
                          ? "border-navy-500 bg-navy-50"
                          : "border-navy-100 hover:border-navy-300 hover:bg-navy-50"
                      }`}
                    >
                      <div className="relative w-5 h-5 flex-shrink-0">
                        {selectedToAdd.includes(course.id) ? (
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
            <div className="px-5 py-4 border-t border-navy-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedToAdd([])
                }}
                className="px-4 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourses}
                disabled={adding || selectedToAdd.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {adding ? "Adding..." : `Add ${selectedToAdd.length} Course(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
