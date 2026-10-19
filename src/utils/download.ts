/**
 * Download and Preview Utilities
 * Handles secure file downloads and previews using API endpoints
 */

const API_BASE_URL = "http://localhost:8000/api"

export interface DownloadResponse {
  download_count: number
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(title: string, extension: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") // Remove invalid chars
    .replace(/\s+/g, "_") // Spaces to underscores
    .substring(0, 100) // Limit length
  return `${sanitized}.${extension}`
}

/**
 * Get file extension from URL or filename
 */
export function getFileExtension(url: string): string {
  const parts = url.split(".")
  return parts[parts.length - 1].split("?")[0].toLowerCase()
}

/**
 * Extract filename from Content-Disposition header
 */
function getFilenameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (!matches || !matches[1]) return null
  return matches[1].replace(/['"]/g, '')
}

/**
 * Trigger file download from blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.rel = "noopener noreferrer"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Delay revoke to allow download to start
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

/**
 * Preview resource in new tab using signed URL
 * Opens window synchronously to avoid popup blockers
 */
export async function previewResource(resourceId: number, token: string): Promise<void> {
  // Get signed URL for preview
  const signedResponse = await fetch(
    `${API_BASE_URL}/resources/${resourceId}/signed-url/?action=view`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  )

  if (!signedResponse.ok) {
    const error = await signedResponse.json().catch(() => ({}))
    throw new Error(error.error || "Failed to generate preview URL")
  }

  const { url } = await signedResponse.json()

  // Open signed URL in new tab
  const newTab = window.open(url, "_blank", "noopener,noreferrer")
  if (!newTab) {
    throw new Error("Popup blocked. Please allow popups for this site.")
  }
}

/**
 * Preview submission in new tab using secure file endpoint
 * Opens window synchronously to avoid popup blockers, then loads content
 */
export async function previewSubmission(submissionId: number, token: string): Promise<void> {
  // Open window immediately (synchronously) to avoid popup blockers
  const newTab = window.open("", "_blank", "noopener,noreferrer")
  if (!newTab) {
    throw new Error("Popup blocked. Please allow popups for this site.")
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/submissions/${submissionId}/file/`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
        },
      },
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || "Preview failed")
    }

    // Get blob and create object URL
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    // Navigate the opened tab to the blob URL
    newTab.location.href = url
    
    // Revoke object URL after a longer delay to allow the new tab to load
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    newTab.close()
    throw error
  }
}

/**
 * Download resource via signed URL
 */
export async function downloadResource(
  resourceId: number,
  token: string,
  resourceTitle: string,
): Promise<DownloadResponse> {
  // Get signed URL for download
  const signedResponse = await fetch(
    `${API_BASE_URL}/resources/${resourceId}/signed-url/?action=download`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    },
  )

  if (!signedResponse.ok) {
    const error = await signedResponse.json().catch(() => ({}))
    throw new Error(error.error || "Failed to generate download URL")
  }

  const { url } = await signedResponse.json()

  // Direct navigation to signed URL triggers download
  window.location.href = url

  return { download_count: 0 }
}

/**
 * Download submission via API (increments count, streams file through Django)
 * Uses fetch + blob to avoid cross-origin issues with Cloudinary URLs
 */
export async function downloadSubmission(
  submissionId: number,
  token: string,
  submissionTitle: string,
): Promise<DownloadResponse> {
  const response = await fetch(
    `${API_BASE_URL}/submissions/${submissionId}/download/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Download failed")
  }

  // Get filename from Content-Disposition header, fallback to sanitized title
  const contentDisposition = response.headers.get("Content-Disposition")
  let filename = getFilenameFromContentDisposition(contentDisposition)
  
  if (!filename) {
    // Fallback: try to get extension from Content-Type or use pdf
    const contentType = response.headers.get("Content-Type")
    let extension = "pdf"
    if (contentType) {
      if (contentType.includes("pdf")) extension = "pdf"
      else if (contentType.includes("word") || contentType.includes("docx")) extension = "docx"
      else if (contentType.includes("doc")) extension = "doc"
    }
    filename = sanitizeFilename(submissionTitle, extension)
  }

  // Get blob and trigger download
  const blob = await response.blob()
  downloadBlob(blob, filename)

  // Return download count from response (if available)
  return { download_count: 0 }
}
