import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Upload,
  Inbox,
  Bell,
  Bookmark,
  Download,
  User,
  GraduationCap,
  FolderOpen,
  RotateCcw,
  Plus,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react"

interface EmptyStateProps {
  variant?:
    | "resources"
    | "submissions"
    | "bookmarks"
    | "downloads"
    | "notifications"
    | "search"
    | "filter"
    | "loading"
    | "error"
    | "generic"
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
  showIllustration?: boolean
}

const VARIANT_CONFIG = {
  resources: {
    icon: BookOpen,
    title: "No resources found",
    description: "We couldn't find any resources matching your criteria. Try adjusting your search or filters.",
    actionLabel: "Clear filters",
    illustration: true,
  },
  submissions: {
    icon: FileText,
    title: "No submissions yet",
    description: "You haven't submitted any work yet. Start by uploading your first academic resource.",
    actionLabel: "Submit Work",
    illustration: true,
  },
  bookmarks: {
    icon: Bookmark,
    title: "No bookmarks yet",
    description: "Save resources you find useful by clicking the bookmark icon on any resource card.",
    actionLabel: "Browse Repository",
    illustration: true,
  },
  downloads: {
    icon: Download,
    title: "No downloads yet",
    description: "Your download history will appear here once you start downloading resources.",
    actionLabel: "Browse Repository",
    illustration: true,
  },
  notifications: {
    icon: Bell,
    title: "No notifications",
    description: "You're all caught up! New notifications will appear here when you receive them.",
    illustration: true,
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try using different keywords or check your spelling.",
    actionLabel: "Clear search",
    illustration: true,
  },
  filter: {
    icon: Filter,
    title: "No results match your filters",
    description: "Try removing some filters or expanding your search criteria.",
    actionLabel: "Clear all filters",
    illustration: true,
  },
  loading: {
    icon: Loader2,
    title: "Loading...",
    description: "Please wait while we fetch the data.",
    illustration: false,
  },
  error: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "We couldn't load the data. Please try again or contact support if the problem persists.",
    actionLabel: "Try again",
    illustration: true,
  },
  generic: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "There's no content to display at the moment.",
    illustration: true,
  },
}

const ILLUSTRATIONS = {
  resources: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-navy-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <BookOpen size={48} className="text-navy-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-navy-50">
        <Search size={16} className="text-navy-500" />
      </div>
    </div>
  ),
  submissions: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <FileText size={48} className="text-purple-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-purple-50">
        <Plus size={16} className="text-purple-500" />
      </div>
    </div>
  ),
  bookmarks: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Bookmark size={48} className="text-blue-300 fill-none stroke-current stroke-2" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-50">
        <Plus size={16} className="text-blue-500" />
      </div>
    </div>
  ),
  downloads: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Download size={48} className="text-emerald-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-50">
        <ArrowLeft size={16} className="text-emerald-500" />
      </div>
    </div>
  ),
  notifications: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Bell size={48} className="text-amber-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-amber-50">
        <CheckCircle size={16} className="text-amber-500" />
      </div>
    </div>
  ),
  search: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-navy-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Search size={48} className="text-navy-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-navy-50">
        <RotateCcw size={16} className="text-navy-500" />
      </div>
    </div>
  ),
  filter: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-navy-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Filter size={48} className="text-navy-300" />
      </div>
      <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-navy-50">
        <X size={16} className="text-navy-500" />
      </div>
    </div>
  ),
  loading: (
    <div className="w-16 h-16 mx-auto mb-6">
      <Loader2 size={32} className="text-navy-500 animate-spin" />
    </div>
  ),
  error: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <AlertTriangle size={48} className="text-red-300" />
      </div>
    </div>
  ),
  generic: (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-100 to-navy-200 rounded-full blur-2xl opacity-50" />
      <div className="relative w-full h-full flex items-center justify-center">
        <Inbox size={48} className="text-navy-300" />
      </div>
    </div>
  ),
}

const SIZE_CLASSES = {
  sm: "py-8 px-4",
  md: "py-12 px-6",
  lg: "py-16 px-8",
}

const TEXT_SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
}

function CheckCircle({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function X({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function BeautifulEmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  size = "md",
  showIllustration = true,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  const displayTitle = title ?? config.title
  const displayDescription = description ?? config.description
  const displayActionLabel = actionLabel ?? config.actionLabel
  const displayIllustration = showIllustration && config.illustration

  if (variant === "loading") {
    return (
      <div className={`flex flex-col items-center justify-center ${SIZE_CLASSES[size]} ${className}`}>
        <Loader2 size={32} className="text-navy-500 animate-spin mb-4" />
        <p className={`text-navy-500 ${TEXT_SIZES[size]}`}>{displayTitle}</p>
        <p className="text-navy-400 text-sm mt-1">{displayDescription}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-navy-100 ${SIZE_CLASSES[size]} ${className}`}>
      {displayIllustration && ILLUSTRATIONS[variant]}

      <div className="max-w-sm">
        <h3 className={`font-bold text-navy-900 mb-2 ${TEXT_SIZES[size]}`}>{displayTitle}</h3>
        <p className="text-navy-500 leading-relaxed mb-6">{displayDescription}</p>

        {(displayActionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {displayActionLabel && onAction && (
              <button
                onClick={onAction}
                className="flex items-center gap-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl transition"
              >
                <Filter size={16} /> {displayActionLabel}
              </button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <button
                onClick={onSecondaryAction}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl transition"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyStateCard({
  variant = "generic",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: {
  variant?: EmptyStateProps["variant"]
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  return (
    <div className={`bg-white rounded-xl border border-navy-100 p-6 text-center ${className}`}>
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-navy-50 flex items-center justify-center">
        <Icon size={28} className="text-navy-400" />
      </div>
      <h4 className="font-semibold text-navy-800 mb-1">{title ?? config.title}</h4>
      <p className="text-navy-500 text-sm mb-4">{description ?? config.description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <Plus size={14} /> {actionLabel}
        </button>
      )}
    </div>
  )
}

export function LoadingState({
  variant = "default",
  message = "Loading...",
  className = "",
}: {
  variant?: "default" | "card" | "table" | "list" | "grid"
  message?: string
  className?: string
}) {
  const skeletons = {
    default: (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Loader2 size={32} className="text-navy-500 animate-spin mb-3" />
        <p className="text-navy-500">{message}</p>
      </div>
    ),
    card: (
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-100 p-5 animate-pulse">
            <div className="h-2.5 bg-gradient-to-r from-navy-200 to-navy-300 rounded mb-4" />
            <div className="h-4 bg-navy-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-navy-100 rounded w-1/2 mb-3" />
            <div className="h-3 bg-navy-100 rounded w-1/3" />
            <div className="border-t border-navy-50 pt-3 mt-auto space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="h-3 bg-navy-100 rounded w-24" />
                <div className="h-3 bg-navy-100 rounded w-16" />
              </div>
              <div className="h-3 bg-navy-100 rounded w-32" />
              <div className="flex items-center justify-between">
                <div className="h-3 bg-navy-100 rounded w-20" />
                <div className="h-8 bg-navy-100 rounded-lg w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    table: (
      <div className={`bg-white rounded-xl border border-navy-100 overflow-hidden ${className}`}>
        <div className="bg-navy-50 border-b border-navy-100 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-navy-200 rounded animate-pulse" />
            <div className="h-4 bg-navy-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-navy-200 rounded w-20 animate-pulse" />
            <div className="h-4 bg-navy-200 rounded w-24 animate-pulse" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-navy-50 animate-pulse">
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-navy-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-navy-100 rounded w-1/2" />
            </div>
            <div className="h-4 bg-navy-100 rounded w-32" />
            <div className="h-4 bg-navy-100 rounded w-20" />
            <div className="h-8 bg-navy-100 rounded-lg w-24" />
          </div>
        ))}
      </div>
    ),
    list: (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-100 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-100" />
              <div className="flex-1">
                <div className="h-4 bg-navy-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-navy-100 rounded w-1/2" />
              </div>
              <div className="w-16 h-6 bg-navy-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    ),
    grid: (
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-100 p-5 animate-pulse">
            <div className="h-2.5 bg-gradient-to-r from-navy-200 to-navy-300 rounded mb-4" />
            <div className="h-4 bg-navy-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-navy-100 rounded w-1/2 mb-3" />
            <div className="h-3 bg-navy-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    ),
  }

  return skeletons[variant]
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
  className = "",
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h3 className="font-semibold text-navy-900 text-lg mb-1">Unable to load</h3>
      <p className="text-navy-500 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
        >
          <RotateCcw size={14} /> Try again
        </button>
      )}
    </div>
  )
}