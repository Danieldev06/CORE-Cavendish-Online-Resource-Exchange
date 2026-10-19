import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import type {
  AppContextType,
  User,
  ViewType,
  Notification,
  ToastMessage,
  LecturerCourse,
} from "./types"
import { authApi, lecturerApi, resourceApi, api } from "./services/api"
import { downloadResource } from "./utils/download"

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>("login")
  const [params, setParams] = useState<Record<string, string>>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [downloadedIds, setDownloadedIds] = useState<string[]>([])
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [lecturerCourses, setLecturerCourses] = useState<LecturerCourse[]>([])

  // ============================================================
  // 🔔 NOTIFICATIONS: Fetch from API + periodic polling
  // ============================================================
  const fetchNotifications = async (unreadOnly = false) => {
    const token = localStorage.getItem("core_token")
    if (!token) return
    try {
      const data = await api.getNotifications(token, unreadOnly)
      setNotifications(data)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  // ============================================================
  // 🔄 ON APP LOAD: Restore user from token
  // ============================================================
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem("core_token")
      if (!token) {
        setAuthLoading(false)
        return
      }
      try {
        const profile = await authApi.me(token)
        // Map Django user to frontend User shape
        const restoredUser: User = {
          id: String(profile.id),
          name:
            `${profile.first_name} ${profile.last_name}`.trim() ||
            profile.email,
          email: profile.email,
          role: profile.role,
          studentId: profile.student_id,
          programme: profile.program,
          department: profile.faculty,
          yearOfStudy: profile.year,
          status: "active",
          dateJoined: new Date().toISOString(),
          profileImage: profile.profile_image,
        }
        setUser(restoredUser)

        // If lecturer, fetch their course assignments
        if (restoredUser.role === "lecturer") {
          try {
            const assignments = await lecturerApi.getMyCourses(token)
            setLecturerCourses(assignments)
          } catch (err) {
            console.error("Failed to load lecturer courses:", err)
          }
          setCurrentView("lecturer-dashboard")
        } else if (restoredUser.role === "student") {
          setCurrentView("student-dashboard")
        } else {
          setCurrentView("admin-dashboard")
        }

        // Fetch notifications after user is restored
        await fetchNotifications()
      } catch (err) {
        // Token invalid — clear it
        localStorage.removeItem("core_token")
      } finally {
        setAuthLoading(false)
      }
    }
    restoreAuth()
  }, [])

  // Periodic polling for notifications (every 30 seconds)
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchNotifications(), 30_000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (!user) {
      setBookmarkedIds([])
      return
    }
    const saved = localStorage.getItem(`core_bookmarks_${user.id}`)
    setBookmarkedIds(saved ? JSON.parse(saved) : [])
  }, [user?.id])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const navigate = (view: ViewType, p?: Record<string, string>) => {
    setCurrentView(view)
    setParams(p ?? {})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const updateUser = (nextUser: User) => setUser(nextUser)

  const login = (u: User, token?: string, redirectTo?: ViewType) => {
    setUser(u)
    if (token) {
      localStorage.setItem("core_token", token)
      void fetchNotifications()
    }

    // If lecturer, fetch their course assignments
    if (u.role === "lecturer" && token) {
      lecturerApi
        .getMyCourses(token)
        .then(setLecturerCourses)
        .catch((err) => console.error("Failed to load lecturer courses:", err))
    }

    const target =
      redirectTo ??
      (u.role === "student"
        ? "student-dashboard"
        : u.role === "lecturer"
          ? "lecturer-dashboard"
          : "admin-dashboard")
    navigate(target)
  }

  const logout = async () => {
    const token = localStorage.getItem("core_token")
    if (token) {
      try {
        await authApi.logout(token)
      } catch {}
    }
    localStorage.removeItem("core_token")
    setUser(null)
    navigate("login")
  }

  const markNotificationRead = async (id: string | number) => {
    setNotifications((ns) =>
      ns.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
    const token = localStorage.getItem("core_token")
    if (token) {
      try {
        await api.markNotificationRead(token, id)
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
      }
    }
  }

  const markAllRead = async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    const token = localStorage.getItem("core_token")
    if (token) {
      try {
        await api.markAllNotificationsRead(token)
      } catch (err) {
        console.error("Failed to mark all notifications as read:", err)
      }
    }
  }

  const deleteNotification = async (id: string | number) => {
    setNotifications((ns) => ns.filter((n) => n.id !== id))
    const token = localStorage.getItem("core_token")
    if (token) {
      try {
        await api.deleteNotification(token, id)
      } catch (err) {
        console.error("Failed to delete notification:", err)
      }
    }
  }

  const deleteAllNotifications = async () => {
    setNotifications([])
    const token = localStorage.getItem("core_token")
    if (token) {
      try {
        await api.deleteAllNotifications(token)
      } catch (err) {
        console.error("Failed to delete notifications:", err)
      }
    }
  }

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((ids) => {
      const next = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
      if (user) {
        localStorage.setItem(`core_bookmarks_${user.id}`, JSON.stringify(next))
      }
      showToast({
        message: ids.includes(id) ? "Bookmark removed" : "Resource bookmarked",
        type: "success",
      })
      return next
    })
  }

  const addDownload = async (resource: {
    id: string
    title: string
    file_pdf?: string
  }) => {
    const token = localStorage.getItem("core_token")
    if (!token) {
      showToast({ message: "Please log in to download", type: "error" })
      return
    }

    try {
      // Use the secure download utility
      await downloadResource(Number(resource.id), token, resource.title)

      // Update local downloaded IDs
      setDownloadedIds((ids) =>
        ids.includes(resource.id) ? ids : [...ids, resource.id],
      )

      showToast({ message: "Download started", type: "success" })
    } catch (err: any) {
      console.error("Download failed:", err)
      showToast({
        message: "Download failed. Please try again.",
        type: "error",
      })
    }
  }

  const showToast = (msg: ToastMessage) => setToast(msg)
  const dismissToast = () => setToast(null)

  // Show loading screen while restoring auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white/60 text-sm">Loading CORE...</div>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider
      value={{
        user,
        currentView,
        params,
        navigate,
        updateUser,
        login,
        logout,
        notifications,
        markNotificationRead,
        markAllRead,
        deleteNotification,
        deleteAllNotifications,
        bookmarkedIds,
        toggleBookmark,
        downloadedIds,
        addDownload,
        toast,
        showToast,
        dismissToast,
        lecturerCourses,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
