import {
  BookOpen,
  Upload,
  Clock,
  Bookmark,
  Download,
  Users,
  ClipboardCheck,
  TrendingUp,
  FileText,
  GraduationCap,
  Award,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"

interface StatMetric {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  bg: string
  trend?: {
    value: number
    label: string
  }
  progress?: {
    current: number
    max: number
  }
  onClick?: () => void
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  trend,
  progress,
  onClick,
}: StatMetric) {
  const hasTrend = trend !== undefined && trend.value !== 0
  const trendPositive = trend ? trend.value > 0 : null

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border border-navy-100 p-5 shadow-sm transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-navy-300 hover:shadow-lg hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
          <span className={`${color} text-[20px]`}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trendPositive
                ? "bg-emerald-50 text-emerald-700"
                : trend.value < 0
                ? "bg-red-50 text-red-700"
                : "bg-navy-50 text-navy-600"
            }`}
          >
            {trendPositive ? (
              <ArrowUpRight size={10} />
            ) : trend.value < 0 ? (
              <ArrowDownRight size={10} />
            ) : (
              <Minus size={10} />
            )}
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-navy-400 font-normal">{trend.label}</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-navy-900 leading-none mb-1.5">
        {value}
      </div>
      <div className="text-xs text-navy-500 font-medium mb-3">{label}</div>

      {progress && (
        <div className="pt-2 border-t border-navy-50">
          <div className="flex items-center justify-between text-[10px] text-navy-400 mb-1.5">
            <span>Progress</span>
            <span className="font-semibold text-navy-600">
              {Math.round((progress.current / progress.max) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r transition-all duration-500"
              style={{
                width: `${(progress.current / progress.max) * 100}%`,
                background: `linear-gradient(90deg, ${color.replace("text-", "bg-").replace("700", "500")}, ${color.replace("text-", "bg-").replace("700", "600")})`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface StatsBentoProps {
  metrics: StatMetric[]
  className?: string
}

export function StatsBento({ metrics, className = "" }: StatsBentoProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <StatCard key={metric.label} {...metric} />
      ))}
    </div>
  )
}

export function createStudentStats({
  resourcesCount,
  submissionsCount,
  pendingCount,
  bookmarksCount,
  resourcesTrend,
  submissionsTrend,
  onNavigate,
}: {
  resourcesCount: number
  submissionsCount: number
  pendingCount: number
  bookmarksCount: number
  resourcesTrend?: number
  submissionsTrend?: number
  onNavigate: (view: string) => void
}) {
  return [
    {
      label: "Available Resources",
      value: resourcesCount.toLocaleString(),
      icon: <BookOpen size={20} />,
      color: "text-navy-700",
      bg: "bg-navy-50",
      trend: resourcesTrend ? { value: resourcesTrend, label: "vs last month" } : undefined,
      onClick: () => onNavigate("repository"),
    },
    {
      label: "My Submissions",
      value: submissionsCount,
      icon: <Upload size={20} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: submissionsTrend ? { value: submissionsTrend, label: "this semester" } : undefined,
      onClick: () => onNavigate("my-submissions"),
    },
    {
      label: "Pending Reviews",
      value: pendingCount,
      icon: <Clock size={20} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: pendingCount > 0 ? { value: 100, label: "awaiting action" } : undefined,
      progress: { current: pendingCount, max: Math.max(pendingCount, 5) },
      onClick: () => onNavigate("my-submissions"),
    },
    {
      label: "Bookmarked",
      value: bookmarksCount,
      icon: <Bookmark size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      onClick: () => onNavigate("bookmarks"),
    },
  ]
}

export function createLecturerStats({
  resourcesCount,
  pendingReviews,
  totalDownloads,
  coursesCount,
  resourcesTrend,
  downloadsTrend,
  onNavigate,
}: {
  resourcesCount: number
  pendingReviews: number
  totalDownloads: number
  coursesCount: number
  resourcesTrend?: number
  downloadsTrend?: number
  onNavigate: (view: string) => void
}) {
  return [
    {
      label: "My Resources",
      value: resourcesCount,
      icon: <FileText size={20} />,
      color: "text-navy-700",
      bg: "bg-navy-50",
      trend: resourcesTrend ? { value: resourcesTrend, label: "this month" } : undefined,
      onClick: () => onNavigate("lecturer-resources"),
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      icon: <ClipboardCheck size={20} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: pendingReviews > 0 ? { value: 100, label: "need attention" } : undefined,
      progress: { current: pendingReviews, max: Math.max(pendingReviews, 10) },
      onClick: () => onNavigate("review-submissions"),
    },
    {
      label: "Total Downloads",
      value: totalDownloads.toLocaleString(),
      icon: <Download size={20} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: downloadsTrend ? { value: downloadsTrend, label: "vs last month" } : undefined,
      onClick: () => onNavigate("lecturer-dashboard"),
    },
    {
      label: "Active Courses",
      value: coursesCount,
      icon: <GraduationCap size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      onClick: () => onNavigate("manage-courses"),
    },
  ]
}

export function createAdminStats({
  totalResources,
  totalUsers,
  pendingApprovals,
  totalDownloads,
  resourcesTrend,
  downloadsTrend,
  usersTrend,
  onNavigate,
}: {
  totalResources: number
  totalUsers: number
  pendingApprovals: number
  totalDownloads: number
  resourcesTrend?: number
  downloadsTrend?: number
  usersTrend?: number
  onNavigate: (view: string) => void
}) {
  return [
    {
      label: "Total Resources",
      value: totalResources.toLocaleString(),
      icon: <FileText size={20} />,
      color: "text-navy-700",
      bg: "bg-navy-50",
      trend: resourcesTrend ? { value: resourcesTrend, label: "this month" } : undefined,
      onClick: () => onNavigate("admin-resources"),
    },
    {
      label: "Registered Users",
      value: totalUsers.toLocaleString(),
      icon: <Users size={20} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: usersTrend ? { value: usersTrend, label: "new this month" } : undefined,
      onClick: () => onNavigate("admin-users"),
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: <ClipboardCheck size={20} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: pendingApprovals > 0 ? { value: 100, label: "action required" } : undefined,
      progress: { current: pendingApprovals, max: Math.max(pendingApprovals, 20) },
      onClick: () => onNavigate("review-submissions"),
    },
    {
      label: "Total Downloads",
      value: totalDownloads.toLocaleString(),
      icon: <TrendingUp size={20} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: downloadsTrend ? { value: downloadsTrend, label: "vs last month" } : undefined,
      onClick: () => onNavigate("admin-analytics"),
    },
  ]
}

export function createCategoryStats(
  resources: any[],
  onNavigate: (view: string) => void
) {
  const typeMap: Record<string, { name: string; icon: React.ReactNode; color: string; bg: string }> = {
    "lecture-notes": { name: "Lecture Notes", icon: <FileText size={16} />, color: "text-navy-700", bg: "bg-navy-50" },
    "past-paper": { name: "Past Papers", icon: <Award size={16} />, color: "text-purple-700", bg: "bg-purple-50" },
    dissertation: { name: "Dissertations", icon: <GraduationCap size={16} />, color: "text-blue-700", bg: "bg-blue-50" },
    thesis: { name: "Theses", icon: <Award size={16} />, color: "text-indigo-700", bg: "bg-indigo-50" },
    "research-proposal": { name: "Proposals", icon: <ClipboardCheck size={16} />, color: "text-teal-700", bg: "bg-teal-50" },
    "journal-article": { name: "Journal Articles", icon: <BookOpen size={16} />, color: "text-cyan-700", bg: "bg-cyan-50" },
    "research-paper": { name: "Research Papers", icon: <FileText size={16} />, color: "text-sky-700", bg: "bg-sky-50" },
    "course-material": { name: "Course Materials", icon: <GraduationCap size={16} />, color: "text-slate-700", bg: "bg-slate-50" },
    "academic-guide": { name: "Academic Guides", icon: <BookOpen size={16} />, color: "text-stone-700", bg: "bg-stone-50" },
    other: { name: "Other", icon: <FileText size={16} />, color: "text-gray-700", bg: "bg-gray-50" },
  }

  const counts: Record<string, number> = {}
  Object.keys(typeMap).forEach((k) => (counts[k] = 0))
  resources.forEach((r) => {
    if (typeMap[r.type]) counts[r.type]++
  })

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count]) => ({
      label: typeMap[type].name,
      value: count,
      icon: typeMap[type].icon,
      color: typeMap[type].color,
      bg: typeMap[type].bg,
      onClick: () => onNavigate("admin-resources"),
    }))
}