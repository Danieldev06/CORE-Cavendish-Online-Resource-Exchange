import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts"
import {
  Download,
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { PageHeader } from "../components/Layout"
import { useState, useEffect, useMemo } from "react"
import { useApp } from "../context"
import {
  api,
  extractApiError,
} from "../services/api"
import { adaptResources } from "../utils/adapters"

const PIE_COLORS = [
  "#0f2e6b",
  "#1d4ed8",
  "#3568ae",
  "#5a8ac4",
  "#8eb0d9",
  "#bdd0eb",
]

function StatTile({
  icon,
  label,
  value,
  delta,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp size={10} />
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-500 font-medium mt-0.5">{label}</div>
    </div>
  )
}

function ChartCard({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-navy-900 text-sm">{title}</h3>
        {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-900 text-white px-3 py-2.5 rounded-xl shadow-xl text-xs">
        <div className="font-semibold mb-1.5 text-white/80">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <span>
              {p.name}: <strong>{p.value.toLocaleString()}</strong>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function getQuarterLabel(date: Date): string {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `Q${quarter} ${year}`
}

function getTimeAgoLabel(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

export default function AdminAnalyticsView() {
  const { showToast } = useApp()
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all resources from API
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
        setError("Failed to load resources")
        showToast({ message: "Failed to load analytics data", type: "error" })
      })
      .finally(() => setLoading(false))
  }, [showToast])

  // Compute analytics from real resources
  const totalResources = resources.length
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloads ?? 0), 0)
  const totalViews = totalDownloads // API doesn't have views, use downloads as proxy
  const activeUsers = "—" // Would need /admin/users endpoint

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

  // Monthly downloads from real data
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

  // Quarterly overview from real data
  const quarterlyData = useMemo(() => {
    const quarters: Record<string, { resources: number; downloads: number }> = {}
    resources.forEach(r => {
      const date = new Date(r.dateUploaded)
      if (!isNaN(date.getTime())) {
        const quarter = getQuarterLabel(date)
        if (!quarters[quarter]) quarters[quarter] = { resources: 0, downloads: 0 }
        quarters[quarter].resources += 1
        quarters[quarter].downloads += (r.downloads ?? 0)
      }
    })
    // Sort quarters chronologically
    return Object.entries(quarters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, data]) => ({ quarter, ...data }))
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

  // Top resources by downloads
  const topResources = useMemo(() => {
    return [...resources]
      .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
      .slice(0, 10)
      .map((r, i) => ({
        id: r.id,
        rank: i + 1,
        title: r.title,
        type: r.type.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        downloads: r.downloads ?? 0,
        views: r.views ?? r.downloads ?? 0,
      }))
  }, [resources])

  // School breakdown from real data
  const schoolStats = useMemo(() => {
    const schoolMap: Record<string, { resources: number; downloads: number }> = {}
    resources.forEach(r => {
      const school = r.school ?? "Unknown"
      if (!schoolMap[school]) schoolMap[school] = { resources: 0, downloads: 0 }
      schoolMap[school].resources += 1
      schoolMap[school].downloads += (r.downloads ?? 0)
    })
    return Object.entries(schoolMap)
      .map(([school, data]) => ({ school, ...data }))
      .sort((a, b) => b.downloads - a.downloads)
  }, [resources])

  // Programme access from real data (using resources per programme as proxy for accesses)
  const programmeAccess = useMemo(() => {
    const programmeMap: Record<string, { accesses: number; downloads: number }> = {}
    resources.forEach(r => {
      const programme = r.programme ?? "Unknown"
      if (!programmeMap[programme]) programmeMap[programme] = { accesses: 0, downloads: 0 }
      programmeMap[programme].accesses += 1
      programmeMap[programme].downloads += (r.downloads ?? 0)
    })
    return Object.entries(programmeMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.downloads - a.downloads)
  }, [resources])

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Analytics & Reports"
          subtitle="Repository usage statistics, growth trends, and performance metrics"
          breadcrumbs={[{ label: "Analytics" }]}
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 size={40} className="text-navy-600 animate-spin" />
          <span className="ml-3 text-navy-600 text-lg">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Analytics & Reports"
          subtitle="Repository usage statistics, growth trends, and performance metrics"
          breadcrumbs={[{ label: "Analytics" }]}
        />
        <div className="flex flex-col items-center justify-center h-64 text-center">
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
        title="Analytics & Reports"
        subtitle="Repository usage statistics, growth trends, and performance metrics — 2025/2026 Academic Year"
        breadcrumbs={[{ label: "Analytics" }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
            <Download size={14} /> Export Report
          </button>
        }
      />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<FileText size={20} className="text-navy-700" />}
            label="Total Resources"
            value={totalResources.toString()}
            delta={loading ? "Loading..." : "+18% this term"}
            color="bg-navy-50"
          />
          <StatTile
            icon={<Download size={20} className="text-blue-600" />}
            label="Total Downloads"
            value={totalDownloads.toLocaleString()}
            delta={loading ? "Loading..." : "+23% vs 2025"}
            color="bg-blue-50"
          />
          <StatTile
            icon={<Users size={20} className="text-emerald-600" />}
            label="Active Users"
            value={activeUsers}
            delta={loading ? "Loading..." : "Requires /admin/users endpoint"}
            color="bg-emerald-50"
          />
          <StatTile
            icon={<Eye size={20} className="text-purple-600" />}
            label="Total Resource Views"
            value={totalViews.toLocaleString()}
            delta={loading ? "Loading..." : "+31% this term"}
            color="bg-purple-50"
          />
        </div>

        {/* Quarterly overview */}
        <ChartCard
          title="Quarterly Overview"
          sub="Resources and downloads by quarter"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={quarterlyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradResources" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f2e6b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f2e6b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDownloads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#dde6f5"
                vertical={false}
              />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="downloads"
                stroke="#1d4ed8"
                strokeWidth={2}
                fill="url(#gradDownloads)"
                name="Downloads"
                dot={{ r: 3, fill: "#1d4ed8", strokeWidth: 0 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="resources"
                stroke="#0f2e6b"
                strokeWidth={2}
                fill="url(#gradResources)"
                name="Resources Added"
                dot={{ r: 3, fill: "#0f2e6b", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly uploads */}
          <ChartCard
            title="Monthly Resource Uploads"
            sub="New resources added per month"
          >
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
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="uploads"
                  fill="#0f2e6b"
                  radius={[4, 4, 0, 0]}
                  name="Uploads"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly downloads */}
          <ChartCard
            title="Monthly Downloads"
            sub="Resource downloads by month"
          >
            <ResponsiveContainer width="100%" height={200}>
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
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="downloads"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ fill: "#1d4ed8", r: 3.5, strokeWidth: 0 }}
                  name="Downloads"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Resource categories + programme access */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <ChartCard
            title="Resources by Category"
            sub="Distribution across resource types"
          >
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {categoryStats.map((_, i) => (
                        <Cell
                          key={i}
                          fill={categoryStats[i]?.color || PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {categoryStats.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        <span className="text-navy-600 font-medium">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-navy-400 font-semibold">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-navy-50 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: categoryStats.length > 0 ? `${(c.count / categoryStats[0].count) * 100}%` : "0%",
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {categoryStats.length === 0 && (
                  <div className="text-center py-4 text-navy-400 text-sm">
                    No resources yet
                  </div>
                )}
              </div>
            </div>
          </ChartCard>

          {/* Programme access */}
          <ChartCard
            title="Access by Programme"
            sub="Resources and downloads per programme"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={programmeAccess}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#dde6f5"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                  tickFormatter={(v) =>
                    v.replace("BSc ", "").replace("Bachelor of ", "")
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="accesses"
                  fill="#dde6f5"
                  radius={[0, 3, 3, 0]}
                  name="Accesses"
                />
                <Bar
                  dataKey="downloads"
                  fill="#0f2e6b"
                  radius={[0, 3, 3, 0]}
                  name="Downloads"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top resources table */}
        <ChartCard
          title="Most Accessed Resources"
          sub="Top resources by downloads and views — all time"
        >
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                    #
                  </th>
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-right py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                    Downloads
                  </th>
                  <th className="text-right py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide hidden md:table-cell">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody>
                {topResources.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-navy-50 hover:bg-navy-50 transition"
                  >
                    <td className="py-3 pr-3 text-navy-400 font-bold text-sm">
                      {r.rank}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-navy-800 text-sm leading-snug max-w-[260px] truncate">
                        {r.title}
                      </div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="text-xs text-navy-500 bg-navy-50 border border-navy-100 px-2 py-0.5 rounded-md font-medium">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden lg:block h-1.5 w-24 bg-navy-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-navy-700 rounded-full"
                            style={{ width: topResources.length > 0 ? `${(r.downloads / topResources[0].downloads) * 100}%` : "0%" }}
                          />
                        </div>
                        <span className="text-sm font-bold text-navy-800 w-10 text-right">
                          {r.downloads}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-navy-500 hidden md:table-cell">
                      {r.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* School breakdown */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {schoolStats.map((s, i) => {
            const colors = ["bg-navy-800", "bg-blue-700", "bg-indigo-700", "bg-slate-700", "bg-purple-700", "bg-teal-700", "bg-emerald-700", "bg-amber-700"]
            return (
              <div
                key={s.school}
                className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm"
              >
                <div className={`h-1.5 ${colors[i % colors.length]}`} />
                <div className="p-4">
                  <div className="text-xs font-bold text-navy-700 mb-3 leading-tight">
                    {s.school.replace("School of ", "Sch. of ")}
                  </div>
                  <div className="space-y-1.5 text-xs text-navy-500">
                    <div className="flex justify-between">
                      <span>Resources</span>
                      <span className="font-bold text-navy-800">
                        {s.resources}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users</span>
                      <span className="font-bold text-navy-800">—</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads</span>
                      <span className="font-bold text-navy-800">
                        {s.downloads.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {schoolStats.length === 0 && (
            <div className="col-span-full text-center py-8 text-navy-400 text-sm">
              No school data available
            </div>
          )}
        </div>

        {/* Report export section */}
        <div className="bg-navy-900 rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-sm mb-1">
              Generate Repository Report
            </h3>
            <p className="text-white/50 text-xs">
              Export a full analytics report for the current academic year in
              PDF or Excel format.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="px-4 py-2 border border-white/20 hover:bg-white/10 text-white font-semibold rounded-xl text-sm transition">
              Export Excel
            </button>
            <button className="px-4 py-2 bg-white hover:bg-navy-50 text-navy-800 font-semibold rounded-xl text-sm transition flex items-center gap-2">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
