import { useState, useEffect } from "react"
import {
  ChevronLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  MessageSquare,
  Eye,
} from "lucide-react"
import { useApp } from "../context"
import {
  submissionApi,
  extractApiError,
  type Submission,
} from "../services/api"
import {
  PageHeader,
  StatusBadge,
  ResourceTypeBadge,
} from "../components/Layout"
import { previewSubmission, downloadSubmission } from "../utils/download"

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

export default function StudentSubmissionDetail() {
  const { params, navigate, showToast } = useApp()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const submissionId = params.id ? Number(params.id) : null
    if (!submissionId) {
      setError("Invalid submission ID")
      setLoading(false)
      return
    }

    const token = localStorage.getItem("core_token")
    if (!token) {
      setError("Your session has expired. Please log in again.")
      setLoading(false)
      return
    }

    submissionApi
      .getDetail(submissionId, token)
      .then(setSubmission)
      .catch((err) => {
        const msg = extractApiError(err)
        setError(msg)
        showToast({
          message: `Failed to load submission: ${msg}`,
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [params.id, showToast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="text-navy-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-navy-100 p-8 text-center shadow-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            Failed to Load Submission
          </h2>
          <p className="text-navy-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("my-submissions")}
            className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Back to My Submissions
          </button>
        </div>
      </div>
    )
  }

  if (!submission) return null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("my-submissions")}
        className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium mb-5 transition"
      >
        <ChevronLeft size={16} /> Back to My Submissions
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Document preview */}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-navy-100 bg-navy-50 flex items-center justify-between">
              <div className="font-semibold text-navy-800 text-sm flex items-center gap-2">
                <FileText size={15} /> Document Preview
              </div>
              <span className="text-xs text-navy-400">
                {formatFileSize(submission.file_size)}
              </span>
            </div>
            <div className="h-80 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-24 bg-white border-2 border-navy-200 rounded-lg mx-auto mb-3 flex items-center justify-center shadow-sm">
                  <FileText size={32} className="text-navy-300" />
                </div>
                <div className="text-navy-500 text-sm font-medium">
                  {submission.title}
                </div>
                <div className="text-navy-400 text-xs mt-1">
                  {formatFileSize(submission.file_size)}
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await previewSubmission(
                          submission.id,
                          localStorage.getItem("core_token") || "",
                        )
                      } catch (err) {
                        console.error("Preview failed:", err)
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs text-navy-700 font-semibold hover:text-navy-900 transition"
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    onClick={() =>
                      downloadSubmission(
                        submission.id,
                        localStorage.getItem("core_token") || "",
                        submission.title,
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-navy-700 font-semibold hover:text-navy-900 transition"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract */}
          {submission.abstract && (
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-3">
                Abstract
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                {submission.abstract}
              </p>
            </div>
          )}

          {/* Status timeline */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
              Submission Status
            </h3>
            <div className="flex items-center gap-0">
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
                  const active = stepStatuses[i].includes(submission.status)
                  const final = i === 3
                  const approved =
                    final &&
                    (submission.status === "approved" ||
                      submission.status === "published")
                  const rejected = final && submission.status === "rejected"
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
                            stepStatuses[i + 1].includes(submission.status)
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
            <div className="mt-4">
              <StatusBadge status={submission.status} />
            </div>
          </div>

          {/* Keywords */}
          {submission.keywords && submission.keywords.length > 0 && (
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-3">
                Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {submission.keywords.map((k) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 text-[11px] bg-navy-50 border border-navy-100 text-navy-600 rounded-md"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer comments - read only for student */}
          {submission.review_comments && (
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-800 text-sm uppercase tracking-wide mb-3">
                Reviewer Comments
              </h3>
              <p className="text-sm text-amber-700 leading-relaxed">
                {submission.review_comments}
              </p>
              {submission.reviewer_name && (
                <p className="text-xs text-amber-500 mt-2">
                  — {submission.reviewer_name}
                </p>
              )}
              {submission.reviewed_date && (
                <p className="text-xs text-amber-500 mt-1">
                  Reviewed:{" "}
                  {new Date(submission.reviewed_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Approved info */}
          {submission.status === "approved" && (
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm bg-emerald-50 border-emerald-100">
              <h3 className="font-semibold text-emerald-800 text-sm uppercase tracking-wide mb-3">
                Approved & Published
              </h3>
              <p className="text-sm text-emerald-700">
                Your submission has been approved and is now visible in the
                academic repository.
              </p>
            </div>
          )}

          {/* Rejected info */}
          {submission.status === "rejected" && submission.review_comments && (
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm bg-red-50 border-red-100">
              <h3 className="font-semibold text-red-800 text-sm uppercase tracking-wide mb-3">
                Submission Rejected
              </h3>
              <p className="text-sm text-red-700">
                {submission.review_comments}
              </p>
              {submission.reviewed_date && (
                <p className="text-xs text-red-500 mt-1">
                  Reviewed:{" "}
                  {new Date(submission.reviewed_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
              Submission Details
            </h3>
            <div className="space-y-3 text-xs">
              {[
                { label: "Title", value: submission.title },
                {
                  label: "Course",
                  value:
                    submission.course_name || submission.course_code || "N/A",
                },
                { label: "Programme", value: submission.program_name || "N/A" },
                {
                  label: "Department",
                  value: submission.department_name || "N/A",
                },
                {
                  label: "Resource Type",
                  value: getResourceTypeLabel(submission.resource_type),
                },
                { label: "Academic Year", value: submission.academic_year },
                {
                  label: "Submitted",
                  value: new Date(
                    submission.submitted_date,
                  ).toLocaleDateString(),
                },
                {
                  label: "File Size",
                  value: formatFileSize(submission.file_size),
                },
              ].map((m, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">
                    {m.label}
                  </div>
                  <div className="text-navy-700 font-medium leading-snug">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-3">
              Current Status
            </h3>
            <StatusBadge status={submission.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
