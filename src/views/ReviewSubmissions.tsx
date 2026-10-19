import { useState, useEffect } from "react"
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  FileText,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Download,
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

function ReviewDetail({ subId, onBack }: { subId: number onBack: () => void }) {
  const { showToast } = useApp()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState<ReviewDecisionType>(null)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) return
    submissionApi
      .getDetail(subId, token)
      .then(setSubmission)
      .catch((err) => {
        const msg = extractApiError(err)
        showToast({
          message: `Failed to load submission: ${msg}`,
          type: "error",
        })
        onBack()
      })
      .finally(() => setLoading(false))
  }, [subId, onBack, showToast])

  const handleReview = async () => {
    if (
      (decision === "reject" || decision === "revision_requested") &&
      !comments.trim()
    )
      return
    if (!submission) return

    setSubmitting(true)
    const token = localStorage.getItem("core_token")
    if (!token) {
      showToast({
        message: "Your session has expired. Please log in again.",
        type: "error",
      })
      setSubmitting(false)
      return
    }

    try {
      const reviewDecision = { decision: decision!, comments }
      await submissionApi.review(submission.id, reviewDecision, token)
      setDone(true)
      const msg =
        decision === "approve"
          ? "Submission approved and published to the repository."
          : decision === "reject"
            ? "Submission rejected. Student notified."
            : "Revision requested. Student notified."
      showToast({
        message: msg,
        type: decision === "approve" ? "success" : "info",
      })
    } catch (err: any) {
      const msg = extractApiError(err)
      let friendlyMsg = `Review failed: ${msg}`
      if (msg.includes("Lecturer access required") || msg.includes("403")) {
        friendlyMsg = "Only lecturers can review submissions. Please log in as a lecturer or contact your administrator to grant review permissions."
      }
      showToast({ message: friendlyMsg, type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="text-navy-600 animate-spin" />
      </div>
    )
  }

  if (!submission) return null

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center shadow-sm">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              decision === "approve"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {decision === "approve" ? (
              <CheckCircle size={32} className="text-emerald-600" />
            ) : (
              <RefreshCw size={32} className="text-blue-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            {decision === "approve"
              ? "Submission Approved"
              : decision === "reject"
                ? "Submission Rejected"
                : "Revision Requested"}
          </h2>
          <p className="text-navy-500 text-sm mb-6">
            The student has been notified of your decision.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium mb-5 transition"
      >
        <ChevronLeft size={16} /> Back to submissions
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

          {/* Decision panel */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
              Review Decision
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  val: "approve" as const,
                  label: "Approve",
                  icon: <CheckCircle size={16} />,
                  color: "border-emerald-300 bg-emerald-50 text-emerald-700",
                  active: "border-emerald-500 bg-emerald-100",
                },
                {
                  val: "reject" as const,
                  label: "Reject",
                  icon: <XCircle size={16} />,
                  color: "border-red-200 bg-red-50 text-red-600",
                  active: "border-red-500 bg-red-100",
                },
                {
                  val: "revision_requested" as const,
                  label: "Request Revision",
                  icon: <RefreshCw size={16} />,
                  color: "border-amber-200 bg-amber-50 text-amber-600",
                  active: "border-amber-500 bg-amber-100",
                },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => setDecision(d.val)}
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl text-sm font-semibold transition ${
                    decision === d.val ? d.active : d.color
                  } hover:opacity-90`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>

            {(decision === "reject" || decision === "revision_requested") && (
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  {decision === "reject"
                    ? "Reason for Rejection"
                    : "Revision Instructions"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder={
                    decision === "reject"
                      ? "Provide clear reasons for rejection..."
                      : "Describe what changes are required..."
                  }
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none"
                />
              </div>
            )}

            {decision === "approve" && (
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Comments (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Add optional comments for the student..."
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none"
                />
              </div>
            )}

            {!decision && (
              <div className="flex items-center gap-2 text-xs text-navy-500 bg-navy-50 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> Select a decision above before
                submitting your review.
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={
                  !decision ||
                  ((decision === "reject" ||
                    decision === "revision_requested") &&
                    !comments.trim()) ||
                  submitting
                }
                className={`px-5 py-2 font-semibold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50 ${
                  decision === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : decision === "reject"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} /> Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
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
                  label: "Student",
                  value: `${submission.student_name} (${submission.student_email?.split("@")[0]}@...)`,
                },
                { label: "Programme", value: submission.program_name || "N/A" },
                {
                  label: "Department",
                  value: submission.department_name || "N/A",
                },
                {
                  label: "Course",
                  value:
                    submission.course_name || submission.course_code || "N/A",
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
        </div>
      </div>
    </div>
  )
}

export default function ReviewSubmissions() {
  const { params, navigate, showToast } = useApp()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      setSelectedId(Number(params.id))
      setLoading(false)
      return
    }

    const token = localStorage.getItem("core_token")
    if (!token) return
    submissionApi
      .list(token)
      .then(setSubmissions)
      .catch((err) => {
        const msg = extractApiError(err)
        setError(msg)
        showToast({
          message: `Failed to load submissions: ${msg}`,
          type: "error",
        })
      })
      .finally(() => setLoading(false))
  }, [params.id, showToast])

  if (selectedId) {
    return (
      <div>
        <PageHeader
          title="Review Submission"
          breadcrumbs={[
            { label: "Review Submissions", view: "review-submissions" },
            { label: "Review" },
          ]}
        />
        <ReviewDetail subId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="text-navy-600 animate-spin" />
      </div>
    )
  }

  const pendingSubmissions = submissions.filter(
    (s) => s.status === "submitted" || s.status === "under_review",
  )

  return (
    <div>
      <PageHeader
        title="Review Submissions"
        subtitle="Review and provide decisions on student-submitted academic work."
        breadcrumbs={[{ label: "Review Submissions" }]}
      />
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {pendingSubmissions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              <strong>
                {pendingSubmissions.length} submission
                {pendingSubmissions.length > 1 ? "s" : ""}
              </strong>{" "}
              awaiting your review.
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
            <div className="col-span-5 text-xs font-semibold text-navy-600 uppercase tracking-wide">
              Submission
            </div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:block">
              Type
            </div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">
              Date
            </div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide">
              Status
            </div>
            <div className="col-span-1 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">
              Action
            </div>
          </div>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-navy-400 text-sm">
              No submissions to review
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 text-navy-400 text-sm">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
              <div className="font-semibold text-navy-600">All caught up!</div>
              <div className="text-xs mt-1">All submissions have been reviewed</div>
            </div>
          ) : (
            submissions.map((s, i) => (
              <div
                key={s.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-navy-50 transition ${
                  i < submissions.length - 1 ? "border-b border-navy-50" : ""
                }`}
              >
                <div className="col-span-5 min-w-0">
                  <div className="font-semibold text-navy-800 text-sm truncate">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-navy-400 mt-0.5">
                    {s.student_name} · {s.program_name || s.department_name}
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <ResourceTypeBadge type={s.resource_type} />
                </div>
                <div className="col-span-2 text-xs text-navy-500 hidden sm:block">
                  {new Date(s.submitted_date).toLocaleDateString()}
                </div>
                <div className="col-span-2">
                  <StatusBadge status={s.status} />
                </div>
                <div className="col-span-1 flex justify-end">
                  {s.status === "submitted" || s.status === "under_review" ? (
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      <Eye size={11} /> Review
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-navy-200 hover:bg-navy-50 text-navy-600 text-xs font-semibold rounded-lg transition"
                    >
                      <Eye size={11} /> View
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
