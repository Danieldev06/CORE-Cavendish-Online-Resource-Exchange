import { useState, useEffect } from "react"
import {
  Download,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Building2,
  BookOpen,
  Tag,
  Eye,
  ExternalLink,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useApp } from "../context"
import { api } from "../services/api"
import { adaptResource } from "../utils/adapters"
import { previewResource } from "../utils/download"
import {
  PageHeader,
  StatusBadge,
  ResourceTypeBadge,
} from "../components/Layout"
import type { Resource } from "../types"

export default function ResourceDetail() {
  const {
    params,
    navigate,
    bookmarkedIds,
    toggleBookmark,
    addDownload,
    showToast,
  } = useApp()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true)
        const data = await api.getResource(Number(params.id))
        const adapted = adaptResource(data)
        setResource(adapted)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch resource:", err)
        setError("Failed to load resource. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchResource()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin" />
        <span className="ml-3 text-navy-600 text-lg">Loading resource...</span>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={40} className="text-red-500 mb-2" />
        <div className="text-red-500 text-lg mb-2">
          ⚠️ {error || "Resource not found"}
        </div>
        <button
          onClick={() => navigate("repository")}
          className="text-navy-600 hover:text-navy-800 underline"
        >
          Back to Repository
        </button>
      </div>
    )
  }

  const bookmarked = bookmarkedIds.includes(resource.id)

  const metaItems = [
    {
      icon: <User size={14} />,
      label: "Author / Uploader",
      value: resource.author,
    },
    {
      icon: <Building2 size={14} />,
      label: "School / Faculty",
      value: resource.school,
    },
    {
      icon: <BookOpen size={14} />,
      label: "Programme",
      value: resource.programme,
    },
    ...(resource.course
      ? [
          {
            icon: <FileText size={14} />,
            label: "Course / Module",
            value: `${
              resource.courseCode ? resource.courseCode + " — " : ""
            }${resource.course}`,
          },
        ]
      : []),
    {
      icon: <Calendar size={14} />,
      label: "Academic Year",
      value: resource.academicYear,
    },
    {
      icon: <Calendar size={14} />,
      label: "Date Uploaded",
      value: resource.dateUploaded,
    },
    {
      icon: <FileText size={14} />,
      label: "File Type",
      value: resource.fileType,
    },
    {
      icon: <FileText size={14} />,
      label: "File Size",
      value: resource.fileSize,
    },
  ]

  return (
    <div>
      <PageHeader
        title={resource.title}
        breadcrumbs={[
          { label: "Repository", view: "repository" },
          {
            label:
              resource.title.length > 40
                ? resource.title.slice(0, 40) + "…"
                : resource.title,
          },
        ]}
      />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <ResourceTypeBadge type={resource.type} />
                <StatusBadge status={resource.status} />
                <span className="text-[11px] text-navy-400 ml-auto">
                  {resource.fileType} · {resource.fileSize}
                </span>
              </div>
              <h1 className="text-xl font-bold text-navy-900 leading-snug mb-3">
                {resource.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500 mb-4">
                <span className="flex items-center gap-1.5 font-medium text-navy-700">
                  <User size={13} />
                  {resource.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} />
                  {resource.school}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {resource.academicYear}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-navy-50">
                <button
                  onClick={() => {
                    showToast({ message: "Starting download...", type: "info" })
                    addDownload({
                      id: resource.id,
                      title: resource.title,
                      file_pdf: resource.file_pdf,
                    })
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={async () => {
                    showToast({ message: "Generating preview link...", type: "info" })
                    try {
                      const token = localStorage.getItem("core_token") || ""
                      const response = await fetch(
                        `http://localhost:8000/api/resources/${Number(resource.id)}/signed-url/?action=view`,
                        {
                          method: "GET",
                          headers: {
                            Authorization: `Token ${token}`,
                          },
                        },
                      )
                      if (!response.ok) {
                        throw new Error("Failed to generate preview link")
                      }
                      const { url } = await response.json()
                      window.open(url, "_blank", "noopener,noreferrer")
                      showToast({ message: "Preview opened in new tab", type: "success" })
                    } catch (err) {
                      console.error("Preview failed:", err)
                      showToast({ message: "Preview failed. Please try again.", type: "error" })
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={() => toggleBookmark(resource.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition ${
                    bookmarked
                      ? "bg-navy-50 border-navy-300 text-navy-800"
                      : "bg-white border-navy-200 hover:bg-navy-50 text-navy-700"
                  }`}
                >
                  {bookmarked ? (
                    <BookmarkCheck size={16} />
                  ) : (
                    <Bookmark size={16} />
                  )}
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
                  <Share2 size={16} /> Share
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
                <span className="flex items-center gap-1">
                  <Download size={11} />
                  {resource.downloads} downloads
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {resource.views} views
                </span>
              </div>
            </div>

            {/* Abstract */}
            {resource.abstract && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 mb-3 text-sm uppercase tracking-wide">
                  Abstract
                </h3>
                <p className="text-sm text-navy-600 leading-relaxed">
                  {resource.abstract}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 mb-3 text-sm uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">
                {resource.description}
              </p>
            </div>

            {/* Document Preview */}
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100 bg-navy-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                  <FileText size={15} /> Document Preview
                </div>
                <button className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1">
                  <ExternalLink size={12} /> Open in viewer
                </button>
              </div>
              <div className="bg-gray-50 h-72 flex items-center justify-center border-b border-navy-100">
                <div className="text-center">
                  <div className="w-16 h-20 bg-white border-2 border-navy-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <FileText size={28} className="text-navy-300" />
                  </div>
                  <div className="text-navy-500 text-sm font-medium">
                    {resource.fileType} Document
                  </div>
                  <div className="text-navy-400 text-xs mt-1">
                    {resource.fileSize}
                  </div>
                  <button
                    onClick={() =>
                      addDownload({
                        id: resource.id,
                        title: resource.title,
                        file_pdf: resource.file_pdf,
                      })
                    }
                    className="mt-3 text-xs text-navy-700 hover:text-navy-900 font-semibold underline"
                  >
                    Download to view
                  </button>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-navy-400">Page 1 of —</span>
                <div className="flex gap-2">
                  <button className="px-2.5 py-1 text-xs border border-navy-200 rounded-lg text-navy-600 hover:bg-navy-50 transition">
                    Previous
                  </button>
                  <button className="px-2.5 py-1 text-xs border border-navy-200 rounded-lg text-navy-600 hover:bg-navy-50 transition">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Metadata */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 mb-4 text-sm uppercase tracking-wide">
                Resource Information
              </h3>
              <div className="space-y-3.5">
                {metaItems.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-navy-50 flex items-center justify-center text-navy-500 shrink-0 mt-0.5">
                      {m.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">
                        {m.label}
                      </div>
                      <div className="text-xs text-navy-700 font-medium mt-0.5">
                        {m.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            {resource.keywords && resource.keywords.length > 0 && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Tag size={13} /> Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.keywords.map((k) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 text-[11px] font-medium bg-navy-50 border border-navy-100 text-navy-600 rounded-lg"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cite this */}
            <div className="bg-navy-50 rounded-xl border border-navy-100 p-4">
              <div className="text-xs font-semibold text-navy-700 mb-2 uppercase tracking-wide">
                Cite This Resource
              </div>
              <p className="text-[11px] text-navy-500 leading-relaxed">
                {resource.author} ({resource.academicYear.split("/")[0]}).{" "}
                <em>{resource.title}</em>. Cavendish University Zambia
                Repository.
              </p>
              <button className="mt-2 text-[11px] text-navy-600 hover:text-navy-800 font-semibold">
                Copy citation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
