import {
  FileText,
  Users,
  ClipboardCheck,
  BookOpen,
  Bookmark,
  Archive,
  TrendingUp,
  Activity,
  ChevronRight,
  Clock,
  CheckCircle,
  Upload,
  Loader2,
  Eye,
  AlertCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useApp } from "../context"
import {
  PageHeader,
  StatusBadge,
  ResourceTypeBadge,
} from "../components/Layout"
import {
  submissionApi,
  api,
  extractApiError,
  type Submission,
} from "../services/api"
import { adaptResources } from "../utils/adapters"
import { useState, useEffect, useMemo } from "react"

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-navy-100 p-5 shadow-sm ${
        onClick
          ? "cursor-pointer hover:border-navy-300 hover:shadow-md transition-all"
          : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            {sub}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-500 mt-0.5 font-medium">{label}</div>
    </div>
  )
}

const ACTIVITY_FEED = [
  {
    time: "2 min ago",
    icon: <Upload size={13} />,
    text: "Dr. Chanda Musonda uploaded COM322 Lecture Notes (Unit 7)",
    color: "bg-navy-100 text-navy-600",
  },
  {
    time: "1 hr ago",
    icon: <ClipboardCheck size={13} />,
    text: "Namwaka Chisanga submitted a research proposal for review",
    color: "bg-amber-100 text-amber-600",
  },
  {
    time: "3 hrs ago",
    icon: <CheckCircle size={13} />,
    text: "Library approved: Machine Learning-Based Price Prediction Dissertation",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    time: "5 hrs ago",
    icon: <Users size={13} />,
    text: "New student account registered: Musonda Zulu (BSc Business Administration)",
    color: "bg-blue-100 text-blue-600",
  },
  {
    time: "Yesterday",
    icon: <Archive size={13} />,
    text: "IT101 Lecture Notes (2019) archived by administrator",
    color: "bg-gray-100 text-gray-500",
  },
  {
    time: "Yesterday",
    icon: <ClipboardCheck size={13} />,
    text: "Dr. Mulenga Kalinda approved: Cybersecurity Awareness Research Paper",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    time: "2 days ago",
    icon: <Upload size={13} />,
    text: "Librarian uploaded: Research Methodology Academic Guide 2026",
    color: "bg-navy-100 text-navy-600",
  },
]

export default function AdminDashboard() {
  const { navigate, showToast } = useApp()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [resources, setResources] = useState<any[]>([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [resourcesError, setResourcesError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) return
    submissionApi
      .list(token)
      .then(setSubmissions)
      .catch((err) => {
        const msg = extractApiError(err)
        console.error("Failed to load submissions:", msg)
      })
      .finally(() => setLoadingSubmissions(false))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("core_token")
    if (!token) return
    api
      .getResources()
      .then((data) => {
        const adapted = adaptResources(data)
        setResources(adapted)
      })
      .catch((err) => {
        const msg = extractApiError(err)
        console.error("Failed to load resources:", msg)
        setResourcesError("Failed to load resources")
        showToast({ message: "Failed to load resources", type: "error" })
      })
      .finally(() => setLoadingResources(false))
  }, [showToast])

  const pendingApprovals = submissions.filter(
    (s) => s.status === "submitted" || s.status === "under_review",
  ).length

  // Compute stats from real resources
  const totalResources = resources.length
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloads ?? 0), 0)
  const dissertations = resources.filter((r) => r.type === "dissertation").length
  const pastPapers = resources.filter((r) => r.type === "past-paper").length
  const lectureNotes = resources.filter((r) => r.type === "lecture-notes").length
  const researchPapers = resources.filter((r) => r.type === "research-paper").length
  const proposals = resources.filter((r) => r.type === "research-proposal").length
  const guides = resources.filter((r) => r.type === "academic-guide").length

  // Monthly uploads from real data
  const monthlyUploads = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const counts: Record<string, number> = {}
    months.forEach(m => counts[m] = 0)
    
    resources.forEach(r => {
      const date = new Date(r.dateUploaded)
      if (!isNaN(date.getTime())) {
        const month = months[date.getMonth()]
        counts[month] = (counts[month] || 0) + 1
      }
    })
    return months.map(month => ({ month, uploads: counts[month] }))
  }, [resources])

  // Monthly downloads from real data (using download_count as proxy)
  const monthlyDownloads = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const counts: Record<string, number> = {}
    months.forEach(m => counts[m] = 0)
    
    resources.forEach(r => {
      const date = new Date(r.dateUploaded)
      if (!isNaN(date.getTime())) {
        const month = months[date.getMonth()]
        counts[month] = (counts[month] || 0) + (r.downloads ?? 0)
      }
    })
    return months.map(month => ({ month, downloads: counts[month] }))
  }, [resources])

  // Category stats from real data
  const categoryStats = useMemo(() => {
    const typeMap: Record<string, { name: string, color: string }> = {
      "lecture-notes": { name: "Lecture Notes", color: "#0f2e6b" },
      "past-paper": { name: "Past Papers", color: "#1d4ed8" },
      "dissertation": { name: "Dissertations", color: "#3568ae" },
      "thesis": { name: "Theses", color: "#5a8ac4" },
      "research-proposal": { name: "Research Proposals", color: "#8eb0d9" },
      "journal-article": { name: "Journal Articles", color: "#bdd0eb" },
      "research-paper": { name: "Research Papers", color: "#7c9bd4" },
      "course-material": { name: "Course Materials", color: "#a8c0e8" },
      "academic-guide": { name: "Academic Guides", color: "#d4e0f4" },
      "other": { name: "Other", color: "#e8ecf4" },
    }
    const counts: Record<string, number> = {}
    Object.keys(typeMap).forEach(k => counts[k] = 0)
    resources.forEach(r => {
      if (typeMap[r.type]) counts[r.type]++
    })
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({ name: typeMap[type].name, count, color: typeMap[type].color }))
      .sort((a, b) => b.count - a.count)
  }, [resources])

  // Activity feed from recent resources + submissions
  const activityFeed = useMemo(() => {
    const activities: any[] = []
    // Recent resource uploads
    const recentResources = [...resources]
      .sort((a, b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime())
      .slice(0, 3)
    recentResources.forEach((r, i) => {
      const timeAgo = getTimeAgo(new Date(r.dateUploaded))
      activities.push({
        time: timeAgo,
        icon: <Upload size={13} />,
        text: `${r.author} uploaded ${r.title}`,
        color: "bg-navy-100 text-navy-600",
      })
    })
    // Recent submissions
    const recentSubmissions = [...submissions]
      .sort((a, b) => new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime())
      .slice(0, 2)
    recentSubmissions.forEach(s => {
      const timeAgo = getTimeAgo(new Date(s.submitted_date))
      activities.push({
        time: timeAgo,
        icon: <ClipboardCheck size={13} />,
        text: `${s.student_name} submitted ${s.title} for review`,
        color: "bg-amber-100 text-amber-600",
      })
    })
    // Approved submissions
    const approvedSubmissions = submissions
      .filter(s => s.status === "approved" || s.status === "published")
      .sort((a, b) => new Date(b.reviewed_date || b.updated_date).getTime() - new Date(a.reviewed_date || a.updated_date).getTime())
      .slice(0, 2)
    approvedSubmissions.forEach(s => {
      const timeAgo = getTimeAgo(new Date(s.reviewed_date || s.updated_date))
      activities.push({
        time: timeAgo,
        icon: <CheckCircle size={13} />,
        text: `Approved: ${s.title}`,
        color: "bg-emerald-100 text-emerald-600",
      })
    })
    return activities.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 7)
  }, [resources, submissions])

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

  return (
    <div>
      <PageHeader
        title="Administrator Dashboard"
        subtitle="Cavendish Online Resource Exchange — System Overview"
      />
      <div className="p-6 max-w-7xl mx-auto space-y-7">
        {loadingResources && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="text-navy-600 animate-spin mr-2" />
            <span className="text-navy-600">Loading dashboard data...</span>
          </div>
        )}
        {resourcesError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>Failed to load resources. </span>
            <button onClick={() => window.location.reload()} className="underline hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {/* Main stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText size={20} className="text-navy-700" />}
            label="Total Resources"
            value={loadingResources ? "—" : totalResources}
            sub={loadingResources ? "Loading..." : resourcesError ? "Failed to load" : "+8 this month"}
            color="bg-navy-50"
            onClick={() => navigate("admin-resources")}
          />
          <StatCard
            icon={<Users size={20} className="text-blue-600" />}
            label="Registered Users"
            value={loadingResources ? "—" : "—"}
            sub={loadingResources ? "Loading..." : "Requires /admin/users endpoint"}
            color="bg-blue-50"
            onClick={() => navigate("admin-users")}
          />
          <StatCard
            icon={<ClipboardCheck size={20} className="text-amber-600" />}
            label="Pending Approvals"
            value={pendingApprovals}
            sub={pendingApprovals > 0 ? "Action needed" : undefined}
            color="bg-amber-50"
            onClick={() => navigate("review-submissions")}
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            label="Total Downloads"
            value={loadingResources ? "—" : totalDownloads.toLocaleString()}
            sub={loadingResources ? "Loading..." : resourcesError ? "Failed" : `${monthlyDownloads[monthlyDownloads.length - 1]?.downloads ?? 0} this month`}
            color="bg-emerald-50"
            onClick={() => navigate("admin-analytics")}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: "Dissertations",
              value: dissertations,
              color: "text-blue-700",
              bg: "bg-blue-50 border-blue-100",
            },
            {
              label: "Past Papers",
              value: pastPapers,
              color: "text-purple-700",
              bg: "bg-purple-50 border-purple-100",
            },
            {
              label: "Lecture Notes",
              value: lectureNotes,
              color: "text-navy-700",
              bg: "bg-navy-50 border-navy-100",
            },
            {
              label: "Research Papers",
              value: researchPapers,
              color: "text-teal-700",
              bg: "bg-teal-50 border-teal-100",
            },
            {
              label: "Proposals",
              value: proposals,
              color: "text-indigo-700",
              bg: "bg-indigo-50 border-indigo-100",
            },
            {
              label: "Guides",
              value: guides,
              color: "text-slate-700",
              bg: "bg-slate-50 border-slate-100",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-3 text-center ${s.bg}`}
            >
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-navy-500 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Uploads chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">
                  Repository Growth
                </h3>
                <p className="text-xs text-navy-400 mt-0.5">
                  Monthly resource uploads — 2026
                </p>
              </div>
              <button
                onClick={() => navigate("admin-analytics")}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
              >
                Full analytics <ChevronRight size={13} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={monthlyUploads}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#dde6f5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d2454",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "#f0f4fb" }}
                />
                <Bar
                  dataKey="uploads"
                  fill="#0f2e6b"
                  radius={[4, 4, 0, 0]}
                  name="Uploads"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-bold text-navy-900 text-sm mb-4">
              Resources by Category
            </h3>
            <div className="space-y-2.5">
              {categoryStats.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-navy-600 font-medium">{c.name}</span>
                    <span className="text-navy-400 font-semibold">
                      {c.count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: categoryStats.length > 0 ? `${(c.count / categoryStats[0].count) * 100}%` : "0%",
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && !loadingResources && (
                <div className="text-center py-4 text-navy-400 text-sm">
                  No resources yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Downloads chart */}
        <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">
                Download Activity
              </h3>
              <p className="text-xs text-navy-400 mt-0.5">
                Total resource downloads per month — 2026
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={monthlyDownloads}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#dde6f5"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d2454",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="downloads"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ fill: "#1d4ed8", r: 3, strokeWidth: 0 }}
                name="Downloads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending approvals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                Pending Approvals
                {pendingApprovals > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {pendingApprovals}
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate("review-submissions")}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
              >
                Review all <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              {submissions
                .filter(
                  (s) =>
                    s.status === "submitted" || s.status === "under_review",
                )
                .slice(0, 4)
                .map((s, i, arr) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 px-4 py-3.5 hover:bg-navy-50 transition ${
                      i < arr.length - 1 ? "border-b border-navy-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy-800 text-sm truncate">
                        {s.title}
                      </div>
                      <div className="text-[11px] text-navy-400 mt-0.5">
                        {s.student_name} · {s.program_name || s.department_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ResourceTypeBadge type={s.resource_type} />
                      <StatusBadge status={s.status} />
                      <button
                        onClick={() =>
                          navigate("review-submissions", { id: String(s.id) })
                        }
                        className="px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              {pendingApprovals === 0 && (
                <div className="text-center py-8 text-navy-400 text-sm">
                  No pending approvals
                </div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                <Activity size={16} className="text-navy-600" /> Recent Activity
              </h3>
              <button
                onClick={() => navigate("admin-activity")}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              {loadingResources ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-navy-50 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-navy-100 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="h-3 bg-navy-100 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-navy-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : activityFeed.length === 0 ? (
                <div className="text-center py-8 text-navy-400 text-sm">
                  No recent activity
                </div>
              ) : (
                activityFeed.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      i < activityFeed.length - 1
                        ? "border-b border-navy-50"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.color}`}
                    >
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-navy-700 leading-snug">
                        {a.text}
                      </div>
                      <div className="text-[10px] text-navy-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} />
                        {a.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
