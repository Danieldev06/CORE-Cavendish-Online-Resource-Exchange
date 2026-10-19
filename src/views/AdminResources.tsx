import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Loader2,
  AlertCircle,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react"
import { useApp } from "../context"
import { RESOURCE_TYPE_LABELS, SCHOOLS } from "../data"
import {
  PageHeader,
  StatusBadge,
  ResourceTypeBadge,
} from "../components/Layout"
import {
  api,
  extractApiError,
  type Resource,
} from "../services/api"
import { adaptResources } from "../utils/adapters"

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
]

function getResourceStatus(r: Resource): string {
  if (r.is_archived) return "archived"
  if (r.is_approved) return "approved"
  return "pending"
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return "approved"
    case "rejected":
      return "rejected"
    case "archived":
      return "archived"
    default:
      return "under_review"
  }
}

export default function AdminResources() {
  const { navigate, showToast } = useApp()
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedSchool, setSelectedSchool] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [editModal, setEditModal] = useState<Resource | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Fetch resources from admin API (server-side pagination/filtering)
  const fetchResources = useCallback(async () => {
    const token = localStorage.getItem("core_token")
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const data = await api.getAdminResources(token, {
        search: search || undefined,
        type: selectedType || undefined,
        status: selectedStatus || undefined,
        school: selectedSchool || undefined,
        page,
        page_size: PAGE_SIZE,
      })
      const adapted = adaptResources(data.results)
      setResources(adapted)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (err) {
      const msg = extractApiError(err)
      console.error("Failed to load resources:", msg)
      setError("Failed to load resources")
      showToast({ message: "Failed to load resources", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [search, selectedType, selectedStatus, selectedSchool, page, showToast])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedType, selectedStatus, selectedSchool, search])

  const toggleSelect = (id: number) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : [...s, id],
    )
  }

  const toggleAll = () => {
    setSelected((s) =>
      s.length === resources.length ? [] : resources.map((r) => r.id),
    )
  }

  const handleAction = async (resourceId: number, action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'delete') => {
    const token = localStorage.getItem("core_token")
    if (!token) return

    setActionLoading(resourceId)
    try {
      const result = await api.adminResourceAction(token, resourceId, action)
      showToast({ message: result.message, type: "success" })
      fetchResources() // Refresh list
    } catch (err) {
      const msg = extractApiError(err)
      showToast({ message: msg || `Failed to ${action} resource`, type: "error" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'archive' | 'delete') => {
    const token = localStorage.getItem("core_token")
    if (!token || selected.length === 0) return

    setActionLoading(-1) // bulk indicator
    try {
      for (const id of selected) {
        await api.adminResourceAction(token, id, action)
      }
      showToast({ message: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${selected.length} resource(s)`, type: "success" })
      setSelected([])
      fetchResources()
    } catch (err) {
      const msg = extractApiError(err)
      showToast({ message: msg || `Bulk ${action} failed`, type: "error" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditModal(resource)
  }

  const handleEditSave = async (data: Partial<Resource>) => {
    const token = localStorage.getItem("core_token")
    if (!token || !editModal) return

    setActionLoading(editModal.id)
    try {
      await api.adminResourceUpdate(token, editModal.id, data)
      showToast({ message: "Resource updated successfully", type: "success" })
      setEditModal(null)
      fetchResources()
    } catch (err) {
      const msg = extractApiError(err)
      showToast({ message: msg || "Failed to update resource", type: "error" })
    } finally {
      setActionLoading(null)
    }
  }

  const isBulkLoading = actionLoading === -1
  const isItemLoading = (id: number) => actionLoading === id

  return (
    <div>
      <PageHeader
        title="Resource Management"
        subtitle="Manage all academic resources in the repository."
        breadcrumbs={[{ label: "Resources" }]}
        actions={
          <button
            onClick={() => navigate("upload-resource")}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            <Plus size={15} /> Upload Resource
          </button>
        }
      />
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">Loading resources...</div>
          </div>
        )}
        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load resources</div>
              <div className="text-xs">{error}</div>
              <button onClick={fetchResources} className="mt-2 text-xs font-semibold underline hover:no-underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition"
              >
                <option value="">All Types</option>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition"
              >
                <option value="">All Schools</option>
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>{s.replace("School of ", "")}</option>
                ))}
              </select>
              <div className="ml-auto text-xs text-navy-500">
                {total} result{total !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Bulk actions bar */}
            {selected.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm">
                <span className="font-semibold text-navy-800">
                  {selected.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isBulkLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Approve
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isBulkLoading ? <Loader2 size={12} className="animate-spin" /> : <Archive size={12} />}
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isBulkLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={isBulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isBulkLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="ml-auto text-navy-400 hover:text-navy-600"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Resources Table */}
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-50 border-b border-navy-100">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selected.length === resources.length && resources.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-navy-300 accent-navy-700"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                      Resource
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">
                      Author
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden xl:table-cell">
                      School
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-navy-400">
                        No resources found
                      </td>
                    </tr>
                  ) : (
                    resources.map((r, i) => {
                      const status = getResourceStatus(r)
                      const isLoading = isItemLoading(r.id)
                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-navy-50 transition ${
                            i < resources.length - 1 ? "border-b border-navy-50" : ""
                          } ${selected.includes(r.id) ? "bg-navy-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(r.id)}
                              onChange={() => toggleSelect(r.id)}
                              disabled={isLoading}
                              className="w-4 h-4 rounded border-navy-300 accent-navy-700"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-navy-800 text-sm max-w-[200px] truncate">
                              {r.title}
                            </div>
                            <div className="text-[11px] text-navy-400 mt-0.5">
                              {r.course_code ?? ""} · {r.upload_date?.split("T")[0] ?? ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="text-sm text-navy-600">{r.author}</div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <ResourceTypeBadge type={r.resource_type} />
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <div className="text-xs text-navy-500 max-w-[140px] truncate">
                              {r.school?.replace("School of ", "") ?? ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-xs text-navy-500">
                              {r.upload_date?.split("T")[0] ?? ""}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={getStatusBadge(status)} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => navigate("resource-detail", { id: r.id })}
                                title="View"
                                disabled={isLoading}
                                className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition disabled:opacity-50"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleEdit(r)}
                                title="Edit"
                                disabled={isLoading}
                                className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition disabled:opacity-50"
                              >
                                <Edit2 size={13} />
                              </button>
                              {!r.is_archived && !r.is_approved && (
                                <button
                                  onClick={() => handleAction(r.id, 'approve')}
                                  title="Approve"
                                  disabled={isLoading}
                                  className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                                >
                                  <CheckCircle size={13} />
                                </button>
                              )}
                              {!r.is_archived && r.is_approved && (
                                <button
                                  onClick={() => handleAction(r.id, 'reject')}
                                  title="Reject"
                                  disabled={isLoading}
                                  className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                                >
                                  <XCircle size={13} />
                                </button>
                              )}
                              {!r.is_archived && (
                                <button
                                  onClick={() => handleAction(r.id, 'archive')}
                                  title="Archive"
                                  disabled={isLoading}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                                >
                                  <Archive size={13} />
                                </button>
                              )}
                              {r.is_archived && (
                                <button
                                  onClick={() => handleAction(r.id, 'unarchive')}
                                  title="Unarchive"
                                  disabled={isLoading}
                                  className="p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                                >
                                  <RotateCcw size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteConfirm(r.id)}
                                title="Delete"
                                disabled={isLoading}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-xs text-navy-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, total)} of {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number
                    if (totalPages <= 5) {
                      p = i + 1
                    } else if (page <= 3) {
                      p = i + 1
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i
                    } else {
                      p = page - 2 + i
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                          p === page
                            ? "bg-navy-800 text-white"
                            : "border border-navy-200 text-navy-600 hover:bg-navy-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  {totalPages > 5 && page > 3 && (
                    <span className="px-2 text-navy-400">...</span>
                  )}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="px-2 text-navy-400">...</span>
                  )}
                  <button
                    disabled={page === totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {editModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-navy-100">
                    <h3 className="font-bold text-navy-900">Edit Resource</h3>
                    <button
                      onClick={() => setEditModal(null)}
                      disabled={isItemLoading(editModal.id)}
                      className="p-1 text-navy-400 hover:text-navy-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <EditResourceForm
                    resource={editModal}
                    onSave={(data) => handleEditSave(data)}
                    onCancel={() => setEditModal(null)}
                    loading={isItemLoading(editModal.id)}
                  />
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 size={24} className="text-red-600" />
                    </div>
                    <h3 className="font-bold text-navy-900 text-lg mb-2">Delete Resource</h3>
                    <p className="text-navy-500 text-sm mb-6">
                      Are you sure you want to delete this resource? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 border border-navy-200 text-navy-700 font-semibold rounded-xl text-sm transition hover:bg-navy-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleAction(deleteConfirm, 'delete')
                          setDeleteConfirm(null)
                        }}
                        disabled={isItemLoading(deleteConfirm)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50"
                      >
                        {isItemLoading(deleteConfirm) ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Edit Resource Form Component
function EditResourceForm({
  resource,
  onSave,
  onCancel,
  loading,
}: {
  resource: Resource
  onSave: (data: Partial<Resource>) => void
  onCancel: () => void
  loading: boolean
}) {
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || "")
  const [resourceType, setResourceType] = useState(resource.resource_type)
  const [isShared, setIsShared] = useState(resource.is_shared)
  const [yearOfStudy, setYearOfStudy] = useState(String(resource.year_of_study))
  const [semester, setSemester] = useState(String(resource.semester))
  const [courseId, setCourseId] = useState(String(resource.course))
  const [keywords, setKeywords] = useState(
    Array.isArray(resource.keywords) ? resource.keywords.join(", ") : ""
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description,
      resource_type: resourceType,
      is_shared: isShared,
      year_of_study: parseInt(yearOfStudy) || 1,
      semester: parseInt(semester) || 1,
      course: parseInt(courseId) || resource.course,
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-navy-600 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy-600 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-navy-600 mb-1">Resource Type *</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
          >
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy-600 mb-1">Course *</label>
          <input
            type="number"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-navy-600 mb-1">Year of Study</label>
          <select
            value={yearOfStudy}
            onChange={(e) => setYearOfStudy(e.target.value)}
            className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
          >
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={String(y)}>Year {y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy-600 mb-1">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
          >
            {[1, 2, 3].map((s) => (
              <option key={s} value={String(s)}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy-600 mb-1">Keywords (comma separated)</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. machine learning, thesis, research"
          className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 focus:ring-2 focus:ring-navy-200"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isShared"
          checked={isShared}
          onChange={(e) => setIsShared(e.target.checked)}
          className="w-4 h-4 rounded border-navy-300 accent-navy-700"
        />
        <label htmlFor="isShared" className="text-sm text-navy-600">
          Shared across all faculties
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-navy-200 text-navy-700 font-semibold rounded-xl text-sm transition hover:bg-navy-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Save Changes
        </button>
      </div>
    </form>
  )
}