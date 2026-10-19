// src/utils/adapters.ts

import { Resource as ApiResource } from "../services/api"

// Map API resource_type to frontend ResourceType

const mapResourceType = (type: string): string => {
  const map: Record<string, string> = {
    NOTES: "lecture-notes",

    PASTPAPER: "past-paper",

    DISSERTATION: "dissertation",

    ARTICLE: "research-paper",
  }

  return map[type] || "other"
}

// Format file size from bytes to human readable

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size"

  if (bytes < 1024) return `${bytes} B`

  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Map API response to frontend Resource type

export const adaptResource = (apiResource: ApiResource): any => ({
  id: apiResource.id.toString(),

  title: apiResource.title,

  type: mapResourceType(apiResource.resource_type),

  author:
    apiResource.uploaded_by_name ||
    apiResource.uploaded_by_username ||
    "Unknown",

  authorId: apiResource.uploaded_by?.toString() || "",

  school: apiResource.department_name || "Unknown School",

  programme: apiResource.program_name || "",

  course: apiResource.course_name || "",

  courseCode: apiResource.course_code || "",

  academicYear: new Date(apiResource.upload_date).getFullYear().toString(),

  dateUploaded: apiResource.upload_date,

  fileType: apiResource.file_pdf?.split(".").pop()?.toUpperCase() || "PDF",

  fileSize: formatFileSize(apiResource.file_size),

  description: apiResource.description || apiResource.title,

  keywords: apiResource.keywords || [],

  status: apiResource.is_approved ? "published" : "draft",

  downloads: apiResource.download_count,

  views: apiResource.download_count,

  file_pdf: apiResource.file_pdf,
})

export const adaptResources = (apiResources: ApiResource[]): any[] =>
  apiResources.map(adaptResource)
