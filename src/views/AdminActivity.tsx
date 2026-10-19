import {
  Clock,
  Filter,
  Upload,
  ClipboardCheck,
  CheckCircle,
  Users,
  Archive,
  AlertCircle,
  Download,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { PageHeader, StatusBadge, ResourceTypeBadge } from "../components/Layout"
import { useState, useEffect, useMemo } from "react"
import { useApp } from "../context"
import {
  api,
  submissionApi,
  extractApiError,
  type Submission,
} from "../services/api"
import { adaptResources } from "../utils/adapters"

const TYPE_STYLES: Record<string, string> = {
  upload: "bg-navy-100 text-navy-600",
  submission: "bg-amber-100 text-amber-700",
  approve: "bg-emerald-100 text-emerald-700",
  reject: "bg-red-100 text-red-600",
  download: "bg-blue-100 text-blue-600",
  user: "bg-purple-100 text-purple-700",
  archive: "bg-gray-100 text-gray-500",
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  upload: <Upload size={13} />,
  submission: <Upload size={13} />,
  approve: <CheckCircle size={13} />,
  reject: <AlertCircle size={13} />,
  download: <Archive size={13} />,
  user: <Users size={13} />,
  archive: <Archive size={13} />,
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function formatTimestamp(date: Date): { dateStr: string; timeStr: string } {
  const dateStr = date.toISOString().split("T")[0]
  const timeStr = date.toTimeString().slice(0, 5)
  return { dateStr, timeStr }
}

function getRoleBadge(role: string): string {
  if (role === "admin") return "bg-purple-50 text-purple-600"
  if (role === "lecturer") return "bg-blue-50 text-blue-600"
  return "bg-navy-50 text-navy-500"
}

export default function AdminActivity() {
  const { showToast } = useApp()
  const [resources, setResources] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) return

    Promise.all([
      api.getResources().then(adaptResources).catch(() => []),
      submissionApi.list(token).catch(() => []),
      api.getAdminUsers(token).catch(() => []),
    ])
      .then(([resData, subData, userData]) => {
        console.log('[AdminActivity] API Data:', {
          resources: resData?.length ?? 0,
          submissions: subData?.length ?? 0,
          users: userData?.length ?? 0,
          resourcesSample: resData?.slice(0, 2),
          submissionsSample: subData?.slice(0, 2),
          usersSample: userData?.slice(0, 2),
        })
        setResources(resData)
        setSubmissions(subData)
        setUsers(userData)
      })
      .catch((err) => {
        const msg = extractApiError(err)
        console.error("Failed to load activity data:", msg)
        setError("Failed to load activity data")
        showToast({ message: "Failed to load activity data", type: "error" })
      })
      .finally(() => setLoading(false))
  }, [showToast])

  const activityFeed = useMemo(() => {
    const activities: any[] = []

    // Resource uploads
    resources.forEach((r) => {
      const date = new Date(r.dateUploaded)
      if (!isNaN(date.getTime())) {
        activities.push({
          id: `resource-${r.id}`,
          timestamp: date,
          user: r.author,
          role: "lecturer",
          action: "Uploaded resource",
          detail: r.title,
          type: "upload",
        })
      }
    })

    // Submissions
    submissions.forEach((s) => {
      const submittedDate = new Date(s.submitted_date)
      if (!isNaN(submittedDate.getTime())) {
        activities.push({
          id: `submission-${s.id}-submitted`,
          timestamp: submittedDate,
          user: s.student_name,
          role: "student",
          action: "Submitted work",
          detail: s.title,
          type: "submission",
        })
      }

      // Review actions
      if (s.reviewed_date && (s.status === "approved" || s.status === "published" || s.status === "rejected" || s.status === "revision_requested")) {
        const reviewedDate = new Date(s.reviewed_date)
        if (!isNaN(reviewedDate.getTime())) {
          const isApproved = s.status === "approved" || s.status === "published"
          activities.push({
            id: `submission-${s.id}-reviewed`,
            timestamp: reviewedDate,
            user: s.reviewer_name || "Reviewer",
            role: "lecturer",
            action: isApproved ? "Approved submission" : s.status === "rejected" ? "Rejected submission" : "Requested revision",
            detail: s.title,
            type: isApproved ? "approve" : "reject",
          })
        }
      }
    })

    // User registrations (from users data)
    users.forEach((u) => {
      const joinedDate = new Date(u.date_joined)
      if (!isNaN(joinedDate.getTime())) {
        activities.push({
          id: `user-${u.id}-joined`,
          timestamp: joinedDate,
          user: `${u.first_name} ${u.last_name}`,
          role: u.role,
          action: "Account created",
          detail: `${u.student_id || u.staff_id || ""} (${u.program || u.faculty})`,
          type: "user",
        })
      }
    })

    // Sort by timestamp descending
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [resources, submissions, users])

  const filteredFeed = useMemo(() => {
    if (filter === "all") return activityFeed
    return activityFeed.filter((a) => a.type === filter)
  }, [activityFeed, filter])

  // Stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const uploadsToday = activityFeed.filter(
    (a) => a.type === "upload" && a.timestamp >= today
  ).length
  const approvalsToday = activityFeed.filter(
    (a) => a.type === "approve" && a.timestamp >= today
  ).length
  const downloadsToday = activityFeed.filter(
    (a) => a.type === "download" && a.timestamp >= today
  ).length
  const eventsThisWeek = activityFeed.filter((a) => a.timestamp >= weekAgo).length

  if (loading) {
    return (
      <div>
        <PageHeader
          title="System Activity"
          subtitle="Complete audit log of all repository actions — uploads, approvals, downloads, and account management."
          breadcrumbs={[{ label: "System Activity" }]}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 size={40} className="text-navy-600 animate-spin mr-2" />
          <span className="text-navy-600 text-lg">Loading activity...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="System Activity"
          subtitle="Complete audit log of all repository actions — uploads, approvals, downloads, and account management."
          breadcrumbs={[{ label: "System Activity" }]}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <AlertCircle size={40} className="text-red-500 mb-2" />
          <div className="text-red-500 text-lg mb-2">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-navy-600 hover:text-navy-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="System Activity"
        subtitle="Complete audit log of all repository actions — uploads, approvals, downloads, and account management."
        breadcrumbs={[{ label: "System Activity" }]}
        actions={
          <>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded mr-2">LIVE DATA</span>
            <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition bg-white"
            >
              <option value="all">All Activity</option>
              <option value="upload">Uploads</option>
              <option value="submission">Submissions</option>
              <option value="approve">Approvals</option>
              <option value="reject">Rejections</option>
              <option value="user">User Accounts</option>
            </select>
            </div>
          </>
        }
      />
      <div className="p-6 max-w-5xl mx-auto">
        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Uploads Today",
              value: uploadsToday,
              color: "bg-navy-50 text-navy-800",
            },
            {
              label: "Approvals Today",
              value: approvalsToday,
              color: "bg-emerald-50 text-emerald-800",
            },
            {
              label: "Downloads Today",
              value: downloadsToday,
              color: "bg-blue-50 text-blue-800",
            },
            {
              label: "Events This Week",
              value: eventsThisWeek,
              color: "bg-purple-50 text-purple-800",
            },
          ].map((t) => (
            <div
              key={t.label}
              className={`rounded-xl border border-navy-100 p-4 ${t.color}`}
            >
              <div className="text-2xl font-bold">{t.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-70">
                {t.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide flex items-center gap-1">
              <Clock size={11} />
              Timestamp
            </div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide">
              User
            </div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:block">
              Action
            </div>
            <div className="col-span-6 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">
              Detail
            </div>
          </div>
          {filteredFeed.length === 0 ? (
            <div className="text-center py-12 text-navy-400">
              <div className="text-lg font-medium mb-1">No activity found</div>
              <div className="text-sm">No {filter !== "all" ? filter + " " : ""}events recorded yet.</div>
            </div>
          ) : (
            filteredFeed.map((entry, i) => {
              const { dateStr, timeStr } = formatTimestamp(entry.timestamp)
              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-start ${
                    i < filteredFeed.length - 1 ? "border-b border-navy-50" : ""
                  } hover:bg-navy-50 transition`}
                >
                  <div className="col-span-2">
                    <div className="text-[11px] font-medium text-navy-600">
                      {dateStr}
                    </div>
                    <div className="text-[10px] text-navy-400">
                      {timeStr}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs font-semibold text-navy-800 truncate">
                      {entry.user}
                    </div>
                    <div
                      className={`text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded inline-block ${getRoleBadge(entry.role)}`}
                    >
                      {entry.role.charAt(0).toUpperCase() + entry.role.slice(1)}
                    </div>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${TYPE_STYLES[entry.type] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {TYPE_ICONS[entry.type]}
                      {entry.action}
                    </div>
                  </div>
                  <div className="col-span-6 hidden sm:block">
                    <div className="text-xs text-navy-600 leading-snug">
                      {entry.detail}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredFeed.length > 50 && (
          <div className="text-center mt-4">
            <button className="text-sm text-navy-600 hover:text-navy-800 font-medium">
              Showing latest 50 events →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}