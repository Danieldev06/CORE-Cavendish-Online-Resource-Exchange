import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useApp } from "../context"
import {
  PageHeader,
  ResourceTypeBadge,
  StatusBadge,
  Modal,
} from "../components/Layout"
import { resourceApi, extractApiError, type Resource } from "../services/api"

export default function LecturerResources() {
  const { user, navigate, showToast } = useApp()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    title: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchResources = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem("core_token")
      if (!token) {
        setError("Your session has expired. Please log in again.")
        setLoading(false)
        return
      }

      try {
        const data = await resourceApi.getLecturerResources(token)
        setResources(data)
        setError("")
        if (showRefreshToast) {
          showToast({ message: "Resources refreshed", type: "success" })
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
    fetchResources()
  }, [fetchResources])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchResources(true)
  }

  const handleDelete = (resource: Resource) => {
    setDeleteTarget({ id: resource.id, title: resource.title })
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
      await resourceApi.delete(deleteTarget.id, token)
      showToast({ message: "Resource deleted successfully", type: "success" })
      setResources(resources.filter((r) => r.id !== deleteTarget.id))
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

  const handleUploadNew = () => {
    navigate("upload-resource")
  }

  return (
    <div>
      <PageHeader
        title="My Resources"
        subtitle={`${resources.length} resource${
          resources.length !== 1 ? "s" : ""
        } uploaded`}
        breadcrumbs={[{ label: "My Resources" }]}
        actions={
          <button
            onClick={handleUploadNew}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            <Plus size={15} /> Upload Resource
          </button>
        }
      />
      <div className="p-6 max-w-5xl mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">
              Loading your resources...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load resources</div>
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

        {!loading && !error && resources.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <div className="text-navy-600 font-semibold">
              No resources uploaded yet
            </div>
            <button
              onClick={handleUploadNew}
              className="mt-4 px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition"
            >
              Upload First Resource
            </button>
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">
                    Downloads
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-navy-50 transition ${
                      i < resources.length - 1 ? "border-b border-navy-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-navy-800 text-sm leading-snug max-w-[220px]">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-navy-400 mt-0.5">
                        {r.course_code ?? ""} ·{" "}
                        {r.upload_date?.split("T")[0] ?? ""} ·{" "}
                        {r.file_size
                          ? (r.file_size / 1024 / 1024).toFixed(2) + " MB"
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <ResourceTypeBadge type={r.resource_type} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs text-navy-500">
                        <Download size={11} /> {r.download_count}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <StatusBadge
                        status={r.is_approved ? "approved" : "under_review"}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            navigate("resource-detail", { id: String(r.id) })
                          }
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() =>
                            showToast({
                              message: "Edit resource — coming soon",
                              type: "info",
                            })
                          }
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
