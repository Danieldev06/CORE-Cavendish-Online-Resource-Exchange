import { useState } from "react"
import {
  Download,
  Bookmark,
  BookmarkCheck,
  Eye,
  FileText,
  Clock,
  User,
  Tag,
  Share2,
  MoreVertical,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react"
import { ResourceTypeBadge, StatusBadge } from "./Layout"
import { useApp } from "../context"
import { previewResource } from "../utils/download"
import type { Resource } from "../types"

const TYPE_GRADIENTS: Record<string, string> = {
  "lecture-notes": "from-navy-700 to-navy-900",
  "past-paper": "from-purple-700 to-purple-900",
  dissertation: "from-blue-700 to-blue-900",
  "research-proposal": "from-teal-700 to-teal-900",
  "research-paper": "from-sky-700 to-sky-900",
  "academic-guide": "from-slate-600 to-slate-800",
  thesis: "from-indigo-700 to-indigo-900",
  "journal-article": "from-cyan-700 to-cyan-900",
  "course-material": "from-slate-600 to-slate-800",
  other: "from-navy-700 to-navy-900",
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  "lecture-notes": <FileText size={20} />,
  "past-paper": <FileText size={20} />,
  dissertation: <FileText size={20} />,
  "research-proposal": <FileText size={20} />,
  "research-paper": <FileText size={20} />,
  "academic-guide": <FileText size={20} />,
  thesis: <FileText size={20} />,
  "journal-article": <FileText size={20} />,
  "course-material": <FileText size={20} />,
  other: <FileText size={20} />,
}

interface FileResourceCardProps {
  resource: Resource
  variant?: "grid" | "list" | "compact"
  showActions?: boolean
  onPreview?: (resource: Resource) => void
  onDownload?: (resource: Resource) => void
  onBookmark?: (resource: Resource) => void
  onShare?: (resource: Resource) => void
  onMore?: (resource: Resource) => void
  className?: string
}

export function FileResourceCard({
  resource,
  variant = "grid",
  showActions = true,
  onPreview,
  onDownload,
  onBookmark,
  onShare,
  onMore,
  className = "",
}: FileResourceCardProps) {
  const { bookmarkedIds, toggleBookmark, addDownload, showToast, navigate } = useApp()
  const [previewLoading, setPreviewLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const bookmarked = bookmarkedIds.includes(resource.id)
  const gradient = TYPE_GRADIENTS[resource.type] ?? "from-navy-700 to-navy-900"
  const typeIcon = TYPE_ICONS[resource.type] ?? <FileText size={20} />

  const handlePreview = async () => {
    if (onPreview) {
      onPreview(resource)
      return
    }
    setPreviewLoading(true)
    try {
      const token = localStorage.getItem("core_token") || ""
      const response = await fetch(
        `http://localhost:8000/api/resources/${Number(resource.id)}/signed-url/?action=view`,
        {
          method: "GET",
          headers: { Authorization: `Token ${token}` },
        }
      )
      if (!response.ok) throw new Error("Failed to generate preview link")
      const { url } = await response.json()
      window.open(url, "_blank", "noopener,noreferrer")
      showToast({ message: "Preview opened in new tab", type: "success" })
    } catch (err) {
      console.error("Preview failed:", err)
      showToast({ message: "Preview failed. Please try again.", type: "error" })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(resource)
      return
    }
    setDownloadLoading(true)
    showToast({ message: "Starting download...", type: "info" })
    addDownload({
      id: resource.id,
      title: resource.title,
      file_pdf: resource.file_pdf,
    })
    setTimeout(() => setDownloadLoading(false), 1000)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onBookmark) {
      onBookmark(resource)
    } else {
      toggleBookmark(resource.id)
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(resource)
    } else if (navigator.share) {
      navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      })
    } else {
      showToast({ message: "Share functionality not available", type: "info" })
    }
  }

  if (variant === "list") {
    return (
      <div className="flex items-center gap-4 px-4 py-3.5 border-b border-navy-50 hover:bg-navy-50 transition group">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate("resource-detail", { id: resource.id })}
            className="text-left w-full"
          >
            <div className="font-semibold text-navy-800 text-sm group-hover:text-navy-600 transition truncate">
              {resource.title}
            </div>
            <div className="text-[11px] text-navy-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="font-medium text-navy-600">{resource.author}</span>
              <span>·</span>
              {resource.courseCode && <span>{resource.courseCode}</span>}
              {resource.courseCode && <span>·</span>}
              <span>{resource.academicYear}</span>
              <span>·</span>
              <span>{resource.fileType}</span>
              <span>·</span>
              <span>{resource.fileSize}</span>
            </div>
          </button>
        </div>
        <div className="hidden md:block shrink-0">
          <ResourceTypeBadge type={resource.type} />
        </div>
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-navy-400 shrink-0">
          <Download size={11} /> {resource.downloads}
        </div>
        {showActions && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg transition ${bookmarked ? "text-navy-700 bg-navy-100" : "text-navy-300 hover:text-navy-600 hover:bg-navy-50"}`}
            >
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition disabled:opacity-50"
              title="Preview"
            >
              {previewLoading ? (
                <ClockIcon size={11} className="animate-spin" />
              ) : (
                <Eye size={11} />
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              <Download size={11} /> {downloadLoading ? "..." : "Download"}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <button
        onClick={() => navigate("resource-detail", { id: resource.id })}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-navy-50 last:border-none hover:bg-navy-50 transition group text-left"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${gradient}`}
        >
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-navy-800 text-sm leading-snug group-hover:text-navy-600 transition line-clamp-1">
            {resource.title}
          </div>
          <div className="text-[11px] text-navy-400 mt-0.5 flex items-center gap-2">
            <span className="font-medium text-navy-600 truncate">{resource.author}</span>
            <span>·</span>
            <span>{resource.courseCode ?? resource.academicYear}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px] text-navy-400">
          <Download size={11} /> {resource.downloads}
          {bookmarked && <BookmarkCheck size={11} className="text-blue-500" />}
        </div>
      </button>
    )
  }

  return (
    <div className={`bg-white rounded-2xl border border-navy-100 p-5 hover:border-navy-300 hover:shadow-xl transition-all duration-200 flex flex-col group ${className}`}>
      <div className={`h-2.5 rounded-t-2xl bg-gradient-to-r ${gradient} mx-5 mt-5 mb-4`} />

      <div className="flex items-start justify-between gap-2 mb-3">
        <ResourceTypeBadge type={resource.type} />
        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition shrink-0 ${bookmarked ? "bg-navy-100 text-navy-700" : "text-navy-300 hover:text-navy-600 hover:bg-navy-50"}`}
        >
          {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>
      </div>

      <button
        onClick={() => navigate("resource-detail", { id: resource.id })}
        className="text-left flex-1"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br {gradient} text-white">
          {typeIcon}
        </div>
        <h3 className="font-semibold text-navy-800 text-base leading-snug mb-2 group-hover:text-navy-600 transition line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-navy-500 text-sm leading-relaxed line-clamp-2 mb-4">
          {resource.description || "No description available."}
        </p>
      </button>

      <div className="border-t border-navy-50 pt-4 mt-auto space-y-3">
        <div className="flex items-center gap-3 text-sm text-navy-500">
          <div className="flex items-center gap-1.5 text-navy-400">
            <User size={14} />
            <span className="font-medium text-navy-700 truncate max-w-[150px]">{resource.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{resource.academicYear}</span>
          </div>
        </div>

        {resource.courseCode && (
          <div className="flex items-center gap-2 text-sm text-navy-500">
            <Tag size={14} className="text-navy-400" />
            <span className="font-medium text-navy-700">{resource.courseCode}</span>
            <span className="text-navy-400">·</span>
            <span>{resource.fileType}</span>
            <span className="text-navy-400">·</span>
            <span>{resource.fileSize}</span>
          </div>
        )}

        <div className="pt-2 border-t border-navy-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-navy-500">
            <Download size={14} className="text-navy-400" />
            <span className="font-medium text-navy-700">{resource.downloads.toLocaleString()}</span>
            <span className="text-navy-400">downloads</span>
          </div>
          {showActions && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePreview}
                disabled={previewLoading}
                className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-xl transition disabled:opacity-50"
                title="Preview"
              >
                {previewLoading ? <ClockIcon size={14} className="animate-spin" /> : <Eye size={14} />}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
              >
                <Download size={13} /> {downloadLoading ? "Downloading..." : "Download"}
              </button>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDropdown(!showDropdown)
                  }}
                  className="p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-xl transition"
                >
                  <MoreVertical size={14} />
                </button>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 z-30 w-40 bg-white border border-navy-100 rounded-xl shadow-xl py-1 overflow-hidden">
                      <button
                        onClick={() => {
                          handleShare(new MouseEvent("click"))
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition flex items-center gap-2"
                      >
                        <Share2 size={14} className="text-navy-400" /> Share
                      </button>
                      <button
                        onClick={() => {
                          handleBookmark(new MouseEvent("click"))
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition flex items-center gap-2"
                      >
                        {bookmarked ? (
                          <>
                            <BookmarkCheck size={14} className="text-navy-400" /> Remove Bookmark
                          </>
                        ) : (
                          <>
                            <Bookmark size={14} className="text-navy-400" /> Bookmark
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FileResourceGridProps {
  resources: Resource[]
  onNavigate: (view: string, params?: Record<string, string>) => void
  bookmarkedIds: string[]
  toggleBookmark: (id: string) => void
  addDownload: (resource: { id: string; title: string; file_pdf: string }) => void
  showToast: (toast: { message: string; type: "success" | "error" | "info" }) => void
  variant?: "grid" | "list"
  className?: string
}

export function FileResourceGrid({
  resources,
  onNavigate,
  bookmarkedIds,
  toggleBookmark,
  addDownload,
  showToast,
  variant = "grid",
  className = "",
}: FileResourceGridProps) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-navy-100">
        <FileText size={48} className="text-navy-200 mx-auto mb-4" />
        <div className="text-navy-600 font-semibold text-lg">No resources found</div>
        <div className="text-navy-400 text-sm mt-1">Try adjusting your search or filters</div>
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
        <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 flex items-center gap-4">
          <span className="flex-1 text-xs font-semibold text-navy-600 uppercase tracking-wide">Resource</span>
          <span className="hidden md:block w-32 text-xs font-semibold text-navy-600 uppercase tracking-wide">Type</span>
          <span className="hidden lg:block w-20 text-xs font-semibold text-navy-600 uppercase tracking-wide">Downloads</span>
          <span className="w-28 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">Actions</span>
        </div>
        {resources.map((resource) => (
          <FileResourceCard
            key={resource.id}
            resource={resource}
            variant="list"
            onNavigate={onNavigate}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {resources.map((resource) => (
        <FileResourceCard
          key={resource.id}
          resource={resource}
          variant="grid"
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

interface ResourceDetailHeaderProps {
  resource: Resource
  onDownload: () => void
  onPreview: () => void
  onBookmark: () => void
  onShare: () => void
  bookmarked: boolean
  downloadLoading?: boolean
  previewLoading?: boolean
}

export function ResourceDetailHeader({
  resource,
  onDownload,
  onPreview,
  onBookmark,
  onShare,
  bookmarked,
  downloadLoading,
  previewLoading,
}: ResourceDetailHeaderProps) {
  const gradient = TYPE_GRADIENTS[resource.type] ?? "from-navy-700 to-navy-900"
  const typeIcon = TYPE_ICONS[resource.type] ?? <FileText size={24} />

  return (
    <div className="relative bg-white rounded-2xl border border-navy-100 overflow-hidden">
      <div className={`h-3 bg-gradient-to-r ${gradient}`} />

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <ResourceTypeBadge type={resource.type} />
              <StatusBadge status={resource.status} />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-navy-900 leading-tight mb-3">
              {resource.title}
            </h1>
            <p className="text-navy-500 text-base lg:text-lg leading-relaxed max-w-3xl">
              {resource.description || "No description available."}
            </p>
          </div>
          <div className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br {gradient} text-white">
            {typeIcon}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-navy-100">
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <User size={18} className="text-navy-600" />
            </div>
            <div>
              <div className="text-[11px] text-navy-400 uppercase tracking-wide">Author</div>
              <div className="font-medium text-navy-800">{resource.author}</div>
            </div>
          </div>
          {resource.courseCode && (
            <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <BookOpen size={18} className="text-navy-600" />
              </div>
              <div>
                <div className="text-[11px] text-navy-400 uppercase tracking-wide">Course</div>
                <div className="font-medium text-navy-800">{resource.courseCode}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Calendar size={18} className="text-navy-600" />
            </div>
            <div>
              <div className="text-[11px] text-navy-400 uppercase tracking-wide">Year</div>
              <div className="font-medium text-navy-800">{resource.academicYear}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Download size={18} className="text-navy-600" />
            </div>
            <div>
              <div className="text-[11px] text-navy-400 uppercase tracking-wide">Downloads</div>
              <div className="font-medium text-navy-800">{resource.downloads.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onDownload}
            disabled={downloadLoading}
            className="flex items-center gap-2 px-5 py-3 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            <Download size={16} /> {downloadLoading ? "Downloading..." : "Download Resource"}
          </button>
          <button
            onClick={onPreview}
            disabled={previewLoading}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl transition disabled:opacity-50"
          >
            <Eye size={16} /> {previewLoading ? "Loading..." : "Preview"}
          </button>
          <button
            onClick={onBookmark}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition ${
              bookmarked
                ? "bg-navy-100 text-navy-700"
                : "bg-white border border-navy-200 hover:bg-navy-50 text-navy-700"
            }`}
          >
            {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {bookmarked ? "Saved" : "Save"}
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl transition"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  )
}