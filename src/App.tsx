import Signup from "./views/Signup"
import ForgotPassword from "./views/ForgotPassword"
import SelectCourses from "./views/SelectCourses"
import LecturerCourseManagement from "./views/LecturerCourseManagement"
import { AppProvider, useApp } from "./context"
import Layout, { Toast } from "./components/Layout"
import Login from "./views/Login"
import StudentDashboard from "./views/StudentDashboard"
import RepositoryView from "./views/RepositoryView"
import ResourceDetail from "./views/ResourceDetail"
import SubmitWork from "./views/SubmitWork"
import MySubmissions from "./views/MySubmissions"
import StudentSubmissionDetail from "./views/StudentSubmissionDetail"
import LecturerDashboard from "./views/LecturerDashboard"
import LecturerResources from "./views/LecturerResources"
import UploadResource from "./views/UploadResource"
import ReviewSubmissions from "./views/ReviewSubmissions"
import AdminDashboard from "./views/AdminDashboard"
import AdminResources from "./views/AdminResources"
import AdminUsers from "./views/AdminUsers"
import ResearchRepository from "./views/ResearchRepository"
import NotificationsView from "./views/NotificationsView"
import ProfileView from "./views/ProfileView"
import BookmarksView from "./views/BookmarksView"
import DownloadHistory from "./views/DownloadHistory"
import {
  AdminCollections,
  AdminCategories,
  AdminSettings,
} from "./views/PlaceholderViews"
import AdminAnalyticsView from "./views/AdminAnalyticsView"
import AdminActivity from "./views/AdminActivity"

function AppRouter() {
  const { user, currentView } = useApp()

  // ============================================================
  // Public pages (no auth required)
  // ============================================================
  if (!user && currentView === "signup") {
    return <Signup />
  }

  if (!user && currentView === "forgot-password") {
    return <ForgotPassword />
  }

  // SelectCourses - requires token but not full user profile (lecturer registration step 2)
  if (!user && currentView === "select-courses") {
    return <SelectCourses />
  }

  // Show Login page if not logged in or view is 'login'
  if (!user || currentView === "login") {
    return <Login />
  }

  const renderView = () => {
    switch (currentView) {
      case "student-dashboard":
        return <StudentDashboard />
      case "repository":
        return <RepositoryView />
      case "resource-detail":
        return <ResourceDetail />
      case "submit-work":
        return <SubmitWork />
      case "my-submissions":
        return <MySubmissions />
      case "submission-detail":
        return <StudentSubmissionDetail />
      case "bookmarks":
        return <BookmarksView />
      case "download-history":
        return <DownloadHistory />
      case "lecturer-dashboard":
        return <LecturerDashboard />
      case "lecturer-resources":
        return <LecturerResources />
      case "upload-resource":
        return <UploadResource />
      case "review-submissions":
        return <ReviewSubmissions />
      case "review-submission-detail":
        return <ReviewSubmissions />
      case "admin-dashboard":
        return <AdminDashboard />
      case "admin-resources":
        return <AdminResources />
      case "admin-users":
        return <AdminUsers />
      case "research-repository":
        return <ResearchRepository />
      case "admin-collections":
        return <AdminCollections />
      case "admin-categories":
        return <AdminCategories />
      case "admin-analytics":
        return <AdminAnalyticsView />
      case "admin-activity":
        return <AdminActivity />
      case "admin-settings":
        return <AdminSettings />
      case "notifications":
        return <NotificationsView />
      case "profile":
        return <ProfileView />
      case "forgot-password":
        return <ForgotPassword />
      case "select-courses":
        return <SelectCourses />
      case "manage-courses":
        return <LecturerCourseManagement />
      default:
        if (user.role === "student") return <StudentDashboard />
        if (user.role === "lecturer") return <LecturerDashboard />
        return <AdminDashboard />
    }
  }

  return <Layout>{renderView()}</Layout>
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <ToastWrapper />
    </AppProvider>
  )
}

function ToastWrapper() {
  return <Toast />
}
