import { useState, useEffect, useRef, useCallback } from "react"
import { useApp } from "../context"
import type { ViewType } from "../types"
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  FileText,
  Bookmark,
  Download,
  Bell,
  User,
  ClipboardCheck,
  Users,
  FolderOpen,
  Tag,
  BarChart2,
  Activity,
  Settings,
  GraduationCap,
  Building2,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Search,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Check,
  ChevronLeft,
  MoreHorizontal,
} from "lucide-react"

interface NavItem {
  label: string
  icon: React.ReactNode
  view: ViewType
  dividerBefore?: boolean
  badge?: number
  badgeColor?: "blue" | "amber" | "red" | "green"
}

interface NavSection {
  title?: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

function getNavSections(role: string, notifications: any[], currentView: ViewType): NavSection[] {
  const unreadCount = notifications.filter((n) => !n.read).length
  const pendingReviewsCount = notifications.filter(
    (n) => !n.read && n.title === "New Submission Received",
  ).length

  if (role === "student") {
    return [
      {
        title: "Main",
        items: [
          { label: "Dashboard", icon: <LayoutDashboard size={16} />, view: "student-dashboard" },
          { label: "Repository", icon: <BookOpen size={16} />, view: "repository" },
        ],
        defaultOpen: true,
      },
      {
        title: "Academic",
        items: [
          {
            label: "Submit Work",
            icon: <Upload size={16} />,
            view: "submit-work",
            dividerBefore: true,
          },
          { label: "My Submissions", icon: <FileText size={16} />, view: "my-submissions" },
        ],
        defaultOpen: true,
      },
      {
        title: "Personal",
        items: [
          { label: "Bookmarks", icon: <Bookmark size={16} />, view: "bookmarks", dividerBefore: true },
          { label: "Download History", icon: <Download size={16} />, view: "download-history" },
          {
            label: "Notifications",
            icon: <Bell size={16} />,
            view: "notifications",
            dividerBefore: true,
            badge: unreadCount,
            badgeColor: "blue",
          },
        ],
        defaultOpen: true,
      },
      {
        title: "Account",
        items: [{ label: "Profile", icon: <User size={16} />, view: "profile" }],
        defaultOpen: true,
      },
    ]
  }

  if (role === "lecturer") {
    return [
      {
        title: "Main",
        items: [
          { label: "Dashboard", icon: <LayoutDashboard size={16} />, view: "lecturer-dashboard" },
          { label: "Repository", icon: <BookOpen size={16} />, view: "repository" },
        ],
        defaultOpen: true,
      },
      {
        title: "Resources",
        items: [
          {
            label: "My Resources",
            icon: <FileText size={16} />,
            view: "lecturer-resources",
            dividerBefore: true,
          },
          { label: "Upload Resource", icon: <Upload size={16} />, view: "upload-resource" },
          {
            label: "Review Submissions",
            icon: <ClipboardCheck size={16} />,
            view: "review-submissions",
            badge: pendingReviewsCount,
            badgeColor: "amber",
          },
        ],
        defaultOpen: true,
      },
      {
        title: "Account",
        items: [
          {
            label: "Notifications",
            icon: <Bell size={16} />,
            view: "notifications",
            dividerBefore: true,
            badge: unreadCount,
            badgeColor: "blue",
          },
          { label: "Profile", icon: <User size={16} />, view: "profile" },
        ],
        defaultOpen: true,
      },
    ]
  }

  return [
    {
      title: "Main",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard size={16} />, view: "admin-dashboard" },
        { label: "Repository", icon: <BookOpen size={16} />, view: "repository" },
      ],
      defaultOpen: true,
    },
    {
      title: "Content",
      items: [
        { label: "Resources", icon: <FileText size={16} />, view: "admin-resources", dividerBefore: true },
        { label: "Submissions", icon: <ClipboardCheck size={16} />, view: "review-submissions", badge: pendingReviewsCount, badgeColor: "amber" },
        { label: "Research", icon: <GraduationCap size={16} />, view: "research-repository" },
      ],
      defaultOpen: true,
    },
    {
      title: "Management",
      items: [
        { label: "Users", icon: <Users size={16} />, view: "admin-users", dividerBefore: true },
        { label: "Schools & Programmes", icon: <Building2 size={16} />, view: "admin-collections" },
        { label: "Categories", icon: <Tag size={16} />, view: "admin-categories" },
      ],
      defaultOpen: true,
    },
    {
      title: "Analytics",
      items: [
        { label: "Analytics", icon: <BarChart2 size={16} />, view: "admin-analytics", dividerBefore: true },
        { label: "System Activity", icon: <Activity size={16} />, view: "admin-activity" },
      ],
      defaultOpen: true,
    },
    {
      title: "Account",
      items: [
        { label: "Notifications", icon: <Bell size={16} />, view: "notifications", badge: unreadCount, badgeColor: "blue" },
        { label: "Settings", icon: <Settings size={16} />, view: "admin-settings" },
      ],
      defaultOpen: true,
    },
  ]
}

export function CoreLogo({ size = "default" }: { size?: "default" | "small" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10">
        <svg viewBox="0 0 36 36" fill="none" width="22" height="22">
          <rect x="3" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.85" />
          <rect x="21" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.55" />
          <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
          <circle cx="9" cy="5" r="2" fill="#60a5fa" />
          <circle cx="18" cy="2.5" r="2" fill="#60a5fa" />
          <circle cx="27" cy="5" r="2" fill="#60a5fa" />
          <line x1="9" y1="5" x2="18" y2="2.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="2.5" x2="27" y2="5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="text-white font-bold text-[17px] leading-none tracking-wide">CORE</div>
        <div className="text-white/40 text-[9px] leading-tight mt-0.5 font-medium tracking-widest uppercase">
          CUZ Repository
        </div>
      </div>
    </div>
  )
}

function NavItemButton({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
  collapsed: boolean
}) {
  const badgeColors = {
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    green: "bg-emerald-500",
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 text-left relative group ${
        active
          ? "bg-white text-navy-900 shadow-sm"
          : "text-white/65 hover:bg-white/8 hover:text-white"
      }`}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <span className={`shrink-0 ${active ? "text-navy-700" : "text-white/50"}`}>
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className={`${badgeColors[item.badgeColor || "blue"]} text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-auto`}>
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}

function NavSectionComponent({
  section,
  currentView,
  navigate,
  collapsed,
  setSidebarOpen,
  openSections,
  toggleSection,
}: {
  section: NavSection
  currentView: ViewType
  navigate: (view: ViewType) => void
  collapsed: boolean
  setSidebarOpen: (open: boolean) => void
  openSections: Set<string>
  toggleSection: (title: string) => void
}) {
  const sectionKey = section.title || "main"
  const isOpen = openSections.has(sectionKey)
  const hasActiveItem = section.items.some((item) => item.view === currentView)

  return (
    <div className={collapsed ? "hidden" : ""}>
      {(section.title || section.collapsible) && (
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors ${
            section.collapsible ? "" : "pointer-events-none"
          }`}
          aria-expanded={isOpen}
        >
          {section.collapsible && (
            <ChevronRight
              size={12}
              className={`text-white/40 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            />
          )}
          <span className="flex-1 text-left">{section.title}</span>
          {section.collapsible && hasActiveItem && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      )}
      {!section.collapsible || isOpen ? (
        <nav className="space-y-0.5 px-3 pb-2" aria-label={section.title || "Navigation"}>
          {section.items.map((item, idx) => {
            const active = currentView === item.view
            return (
              <div key={item.view}>
                {item.dividerBefore && idx > 0 && (
                  <div className="my-2 border-t border-white/8" />
                )}
                <NavItemButton
                  item={item}
                  active={active}
                  onClick={() => {
                    navigate(item.view)
                    setSidebarOpen(false)
                  }}
                  collapsed={collapsed}
                />
              </div>
            )
          })}
        </nav>
      ) : (
        <div className="h-0 overflow-hidden transition-all duration-200" />
      )}
    </div>
  )
}

export function Sidebar({
  user,
  currentView,
  navigate,
  logout,
  notifications,
  collapsed,
  onToggleCollapse,
  sidebarOpen,
  setSidebarOpen,
}: {
  user: any
  currentView: ViewType
  navigate: (view: ViewType) => void
  logout: () => void
  notifications: any[]
  collapsed: boolean
  onToggleCollapse: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const navRef = useRef<HTMLNavElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const itemsRef = useRef<HTMLButtonElement[]>([])

  const sections = getNavSections(user.role, notifications, currentView)

  useEffect(() => {
    sections.forEach((section) => {
      if (section.defaultOpen) {
        setOpenSections((prev) => new Set(prev).add(section.title || "main"))
      }
    })
  }, [])

  useEffect(() => {
    const hasActive = sections.some((s) => s.items.some((item) => item.view === currentView))
    if (hasActive) {
      setOpenSections((prev) => {
        const next = new Set(prev)
        sections.forEach((section) => {
          if (section.items.some((item) => item.view === currentView)) {
            next.add(section.title || "main")
          }
        })
        return next
      })
    }
  }, [currentView, sections])

  const toggleSection = useCallback((title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const allItems = itemsRef.current.filter((btn) => !btn.disabled && btn.offsetParent !== null)
      if (allItems.length === 0) return

      let newIndex = focusedIndex

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          newIndex = (focusedIndex + 1) % allItems.length
          break
        case "ArrowUp":
          e.preventDefault()
          newIndex = (focusedIndex - 1 + allItems.length) % allItems.length
          break
        case "Home":
          e.preventDefault()
          newIndex = 0
          break
        case "End":
          e.preventDefault()
          newIndex = allItems.length - 1
          break
        case "Enter":
        case " ":
          e.preventDefault()
          allItems[focusedIndex]?.click()
          break
        case "Escape":
          if (collapsed) onToggleCollapse()
          break
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex)
        allItems[newIndex]?.focus()
      }
    },
    [focusedIndex, collapsed, onToggleCollapse]
  )

  const roleLabel =
    user.role === "admin"
      ? "Librarian / Admin"
      : user.role === "lecturer"
      ? "Lecturer"
      : "Student"
  const roleColor =
    user.role === "admin"
      ? "bg-purple-500/20 text-purple-200"
      : user.role === "lecturer"
      ? "bg-blue-500/20 text-blue-200"
      : "bg-white/10 text-white/60"

  const unreadCount = notifications.filter((n) => !n.read).length
  const pendingReviewsCount = notifications.filter(
    (n) => !n.read && n.title === "New Submission Received",
  ).length

  return (
    <aside
      className={`fixed lg:relative z-50 flex flex-col transition-all duration-300 ease-in-out bg-navy-900 ${
        collapsed ? "w-16" : "w-64"
      }`}
      onKeyDown={handleKeyDown}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && <CoreLogo />}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
              collapsed ? "ml-auto" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 mx-3 mb-4 rounded-xl bg-white/5 border border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-sm font-semibold truncate">{user.name}</div>
                <div className={`text-[10px] font-medium px-2 py-0.5 rounded inline-flex mt-1 ${roleColor}`}>
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto sidebar-scrollbar px-3 pb-4"
          role="navigation"
          aria-label="Sidebar navigation"
        >
          {sections.map((section, sectionIdx) => (
            <NavSectionComponent
              key={section.title || sectionIdx}
              section={section}
              currentView={currentView}
              navigate={navigate}
              collapsed={collapsed}
              setSidebarOpen={setSidebarOpen}
              openSections={openSections}
              toggleSection={toggleSection}
            />
          ))}
        </nav>

        <div className={`border-t border-white/10 p-3 ${collapsed ? "hidden" : ""}`}>
          <button
            onClick={() => {
              logout()
              setSidebarOpen(false)
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all"
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign Out</span>}
          </button>
          {!collapsed && (
            <div className="mt-3 px-3 text-[10px] text-white/20 leading-relaxed text-center">
              CORE v1.0 — Cavendish University Zambia
              <br />© 2026 All rights reserved.
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export function SidebarProvider({
  children,
  user,
  currentView,
  navigate,
  logout,
  notifications,
}: {
  children: React.ReactNode
  user: any
  currentView: ViewType
  navigate: (view: ViewType) => void
  logout: () => void
  notifications: any[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapse = () => setCollapsed((c) => !c)

  return (
    <>
      <style jsx>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 10px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }
      `}</style>
      <Sidebar
        user={user}
        currentView={currentView}
        navigate={navigate}
        logout={logout}
        notifications={notifications}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <Sidebar
            user={user}
            currentView={currentView}
            navigate={navigate}
            logout={logout}
            notifications={notifications}
            collapsed={false}
            onToggleCollapse={() => {}}
            sidebarOpen={true}
            setSidebarOpen={setMobileOpen}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <header className="h-14 bg-white border-b border-navy-100 flex items-center px-5 gap-4 shrink-0 shadow-sm">
          <button
            className="lg:hidden text-navy-500 hover:text-navy-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 max-w-sm hidden sm:flex">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-navy-50 border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 focus:border-navy-300 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate("repository")
                }}
              />
            </div>
          </div>

          {children}
        </header>
      </div>
    </>
  )
}