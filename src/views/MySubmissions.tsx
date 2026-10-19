import { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Plus,
  Loader2,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useApp } from "../context"
import {
  PageHeader,
  StatusBadge,
  ResourceTypeBadge,
  Modal,
} from "../components/Layout"
import {
  submissionApi,
  extractApiError,
  type Submission,
} from "../services/api"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    NOTES: "Lecture Notes",
    PASTPAPER: "Past Exam Paper",
    DISSERTATION: "Dissertation",
    ARTICLE: "Research Article",
  }
  return labels[type] || type
}

export default function MySubmissions() {
  const { user, navigate, showToast } = useApp()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    title: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSubmissions = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem("core_token")
      if (!token) {
        setError("Your session has expired. Please log in again.")
        setLoading(false)
        return
      }

      try {
        const data = await submissionApi.getMySubmissions(token)
        setSubmissions(data)
        setError("")
        if (showRefreshToast) {
          showToast({ message: "Submissions refreshed", type: "success" })
        }
      } catch (err: any) {
        setError(extractApiError(err))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [showToast],
  )

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSubmissions(true)
  }

  const handleDelete = (submission: Submission) => {
    setDeleteTarget({ id: submission.id, title: submission.title })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const token = localStorage.getItem("core_token")
    if (!token) {
      showToast({
        message: "Your session has expired. Please log in again.",
        type: "error",
      })
      setDeleting(false)
      return
    }

    try {
      await submissionApi.delete(deleteTarget.id, token)
      showToast({ message: "Submission deleted successfully", type: "success" })
      setSubmissions(submissions.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      const msg = extractApiError(err)
      showToast({ message: `Delete failed: ${msg}`, type: "error" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const cancelDelete = () => {
    setDeleteTarget(null)
  }

  const counts = {
    total: submissions.length,
    pending: submissions.filter((s) =>
      ["submitted", "under_review"].includes(s.status),
    ).length,
    approved: submissions.filter((s) =>
      ["approved", "published"].includes(s.status),
    ).length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    revision: submissions.filter((s) => s.status === "revision_requested")
      .length,
  }

  return (
    <div>
      <PageHeader
        title="My Submissions"
        subtitle="Track the status of your submitted academic work."
        breadcrumbs={[{ label: "My Submissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              onClick={() => navigate("submit-work")}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
            >
              <Plus size={15} /> New Submission
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            {
              label: "Total Submissions",
              value: counts.total,
              color: "text-navy-800",
              bg: "bg-navy-50 border-navy-100",
            },
            {
              label: "Pending",
              value: counts.pending,
              color: "text-amber-700",
              bg: "bg-amber-50 border-amber-100",
            },
            {
              label: "Under Review",
              value: counts.revision,
              color: "text-blue-700",
              bg: "bg-blue-50 border-blue-100",
            },
            {
              label: "Approved",
              value: counts.approved,
              color: "text-emerald-700",
              bg: "bg-emerald-50 border-emerald-100",
            },
            {
              label: "Rejected",
              value: counts.rejected,
              color: "text-red-700",
              bg: "bg-red-50 border-red-100",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-navy-500 font-medium mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">
              Loading your submissions...
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">
                Couldn't load submissions
              </div>
              <div className="text-xs">{error}</div>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && submissions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <FileText size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">
              No submissions yet
            </div>
            <div className="text-navy-400 text-sm mt-1 mb-4">
              Submit your academic work to get started
            </div>
            <button
              onClick={() => navigate("submit-work")}
              className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition"
            >
              Submit Work
            </button>
          </div>
        )}

        {/* Submissions list */}
        {!loading && !error && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-800 text-sm leading-snug">
                        {sub.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-navy-400">
                        {sub.course_code && (
                          <>
                            <span className="font-medium text-navy-600">
                              {sub.course_code}
                            </span>
                            <span>·</span>
                          </>
                        )}
                        {sub.course_name && <span>{sub.course_name}</span>}
                        {sub.program_name && (
                          <>
                            <span>·</span>
                            <span>{sub.program_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ResourceTypeBadge type={sub.resource_type} />
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>

                  {/* Progress timeline */}
                  <div className="flex items-center gap-0 mt-4 mb-4">
                    {["Submitted", "Under Review", "Revision", "Decision"].map(
                      (step, i) => {
                        const stepStatuses: Record<number, string[]> = {
                          0: [
                            "submitted",
                            "under_review",
                            "revision_requested",
                            "approved",
                            "rejected",
                            "published",
                          ],
                          1: [
                            "under_review",
                            "revision_requested",
                            "approved",
                            "rejected",
                            "published",
                          ],
                          2: ["revision_requested"],
                          3: ["approved", "rejected", "published"],
                        }
                        const active = stepStatuses[i].includes(sub.status)
                        const final = i === 3
                        const approved =
                          final &&
                          (sub.status === "approved" ||
                            sub.status === "published")
                        const rejected = final && sub.status === "rejected"
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                                  approved
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : rejected
                                      ? "bg-red-500 border-red-500 text-white"
                                      : active
                                        ? "bg-navy-800 border-navy-800 text-white"
                                        : "bg-white border-navy-200 text-navy-300"
                                }`}
                              >
                                {approved ? "✓" : rejected ? "✕" : i + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1 font-medium ${
                                  active ? "text-navy-700" : "text-navy-300"
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                            {i < 3 && (
                              <div
                                className={`flex-1 h-0.5 mx-1 ${
                                  active &&
                                  stepStatuses[i + 1].includes(sub.status)
                                    ? "bg-navy-300"
                                    : "bg-navy-100"
                                }`}
                              />
                            )}
                          </div>
                        )
                      },
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-400">
                    <span>
                      Submitted:{" "}
                      <span className="text-navy-600 font-medium">
                        {new Date(sub.submitted_date).toLocaleDateString()}
                      </span>
                    </span>
                    <span>
                      File:{" "}
                      <span className="text-navy-600">
                        {formatFileSize(sub.file_size)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Under review info */}
                {sub.status === "under_review" && (
                  <div className="mx-5 mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Clock
                      size={14}
                      className="text-blue-600 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-blue-700">
                      Your submission is currently being reviewed by a lecturer.
                      You will be notified once a decision is made.
                    </p>
                  </div>
                )}

                {/* Revision requested info */}
                {sub.status === "revision_requested" && sub.review_comments && (
                  <div className="mx-5 mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <AlertCircle
                      size={14}
                      className="text-amber-600 shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-amber-700 font-semibold mb-1">
                        Revision Requested
                      </p>
                      <p className="text-xs text-amber-700">
                        {sub.review_comments}
                      </p>
                      {sub.reviewed_date && (
                        <p className="text-xs text-amber-500 mt-1">
                          Reviewed:{" "}
                          {new Date(sub.reviewed_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Approved info */}
                {sub.status === "approved" && (
                  <div className="mx-5 mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                    <CheckCircle
                      size={14}
                      className="text-emerald-600 shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-emerald-700">
                      Your submission has been approved and is now visible in
                      the academic repository.
                    </p>
                  </div>
                )}

                {/* Rejected info */}
                {sub.status === "rejected" && sub.review_comments && (
                  <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <XCircle
                      size={14}
                      className="text-red-600 shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-red-700 font-semibold mb-1">
                        Submission Rejected
                      </p>
                      <p className="text-xs text-red-700">
                        {sub.review_comments}
                      </p>
                      {sub.reviewed_date && (
                        <p className="text-xs text-red-500 mt-1">
                          Reviewed:{" "}
                          {new Date(sub.reviewed_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* View details button */}
                <div className="px-5 pb-5">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate("submission-detail", { id: String(sub.id) })
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
  ;<Modal
    isOpen={!!deleteTarget}
    onClose={() => setDeleteTarget(null)}
    onConfirm={confirmDelete}
    title="Delete Submission"
    message={
      deleteTarget!.title
        ? `Are you sure you want to delete "${deleteTarget!.title}"? This action cannot be undone.`
        : ""
    }
    confirmLabel="Delete"
    cancelLabel="Cancel"
    variant="danger"
    loading={deleting}
  />
}
