import { useState, useEffect, useRef } from "react"

import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  BookOpen,
  GraduationCap,
  Users,
  Mail,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle,
} from "lucide-react"

import { useApp } from "../context"

import { authApi, extractApiError } from "../services/api"

import { PageHeader } from "../components/Layout"

const FEATURE_BULLETS = [
  {
    icon: <BookOpen size={15} />,
    text: "250+ academic resources — lecture notes, dissertations, past papers, and research publications",
  },

  {
    icon: <GraduationCap size={15} />,
    text: "Structured by school, programme, and module across all CUZ faculties",
  },

  {
    icon: <Users size={15} />,
    text: "Role-based access for students, lecturers, and library administrators",
  },

  {
    icon: <Shield size={15} />,
    text: "Secure, institutional-grade digital repository managed by the CUZ Library",
  },
]

export default function ForgotPassword() {
  const { navigate } = useApp()

  const [email, setEmail] = useState("")

  const [step, setStep] = useState<"request" | "confirm">("request")

  const [uid, setUid] = useState("")

  const [token, setToken] = useState("")

  const [newPassword, setNewPassword] = useState("")

  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPass, setShowPass] = useState(false)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const [loading, setLoading] = useState(false)

  const [resendCooldown, setResendCooldown] = useState(0)

  const timerRef = useRef<number | null>(null)

  // Check for uid/token in URL on mount (from email link)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)

    const urlUid = searchParams.get("uid")

    const urlToken = searchParams.get("token")

    if (urlUid && urlToken) {
      setUid(urlUid)

      setToken(urlToken)

      setStep("confirm")

      // Clean URL without reload

      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Resend cooldown timer

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = window.setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current!)

            return 0
          }

          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current!)
    }
  }, [resendCooldown])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")

    setSuccess("")

    if (!email) {
      setError("Please enter your email address.")

      return
    }

    setLoading(true)

    try {
      await authApi.passwordResetRequest(email)

      setSuccess(
        "Password reset instructions have been sent to your email. Please check your inbox (and spam folder).",
      )

      setResendCooldown(60) // 60 second cooldown
    } catch (err: any) {
      setError(extractApiError(err) || "Failed to request password reset.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendToken = async () => {
    if (resendCooldown > 0) return

    setError("")

    setSuccess("")

    setLoading(true)

    try {
      await authApi.passwordResetRequest(email)

      setSuccess("A new reset link has been sent to your email.")

      setResendCooldown(60)
    } catch (err: any) {
      setError(extractApiError(err) || "Failed to resend password reset.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")

    setSuccess("")

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.")

      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")

      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")

      return
    }

    if (!uid || !token) {
      setError("Invalid or missing reset link. Please request a new one.")

      setStep("request")

      return
    }

    setLoading(true)

    try {
      await authApi.passwordResetConfirm(uid, token, newPassword)

      setSuccess("Password has been reset successfully!")

      setTimeout(() => navigate("login"), 2000)
    } catch (err: any) {
      const errorMessage = extractApiError(err) || "Failed to reset password."

      setError(errorMessage)

      // If token is invalid/expired, go back to request step

      if (
        errorMessage.includes("Invalid or expired") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("Invalid reset link")
      ) {
        setStep("request")

        setUid("")

        setToken("")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — institutional branding */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full border border-white/5" />
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full border border-white/5" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-navy-900 -translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 right-0 w-1 h-64 bg-white/5 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3.5 mb-14">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 border border-white/10">
              <svg viewBox="0 0 36 36" fill="none" width="28" height="28">
                <rect
                  x="3"
                  y="10"
                  width="12"
                  height="18"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="21"
                  y="10"
                  width="12"
                  height="18"
                  rx="1.5"
                  fill="white"
                  opacity="0.55"
                />
                <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
                <circle cx="9" cy="5" r="2" fill="#60a5fa" />
                <circle cx="18" cy="2.5" r="2" fill="#60a5fa" />
                <circle cx="27" cy="5" r="2" fill="#60a5fa" />
                <line
                  x1="9"
                  y1="5"
                  x2="18"
                  y2="2.5"
                  stroke="#60a5fa"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <line
                  x1="18"
                  y1="2.5"
                  x2="27"
                  y2="5"
                  stroke="#60a5fa"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-2xl tracking-wide leading-none">
                CORE
              </div>
              <div className="text-white/35 text-[10px] tracking-widest uppercase font-medium mt-0.5">
                Cavendish Online Resource Exchange
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-white leading-tight mb-3">
              Centralizing Knowledge.
              <br />
              Empowering Learning.
            </h1>
            <p className="text-white/45 text-sm leading-relaxed mb-10">
              The official instructional and academic repository of Cavendish
              University Zambia. Access, manage, and share academic resources
              across all schools and programmes.
            </p>

            <div className="space-y-4">
              {FEATURE_BULLETS.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <p className="text-white/50 text-[13px] leading-relaxed">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { val: "250+", label: "Resources" },

                { val: "4", label: "Schools" },

                { val: "12+", label: "Programmes" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-white font-bold text-xl">{s.val}</div>
                  <div className="text-white/30 text-xs font-medium mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-white/20 text-[11px]">
              © {new Date().getFullYear()} Cavendish University Zambia · Library
              & Academic Resources
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — forgot password form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 36 36" fill="none" width="22" height="22">
                <rect
                  x="3"
                  y="10"
                  width="12"
                  height="18"
                  rx="1.5"
                  fill="white"
                  opacity="0.9"
                />
                <rect
                  x="21"
                  y="10"
                  width="12"
                  height="18"
                  rx="1.5"
                  fill="white"
                  opacity="0.55"
                />
                <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
              </svg>
            </div>
            <div>
              <div className="text-navy-900 font-bold text-xl">CORE</div>
              <div className="text-navy-400 text-[10px] uppercase tracking-widest">
                CUZ Repository
              </div>
            </div>
          </div>

          <div className="mb-8">
            <button
              onClick={() => navigate("login")}
              className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium transition mb-6"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
            <h2 className="text-[22px] font-bold text-navy-900 leading-tight">
              {step === "request" ? "Forgot Password?" : "Reset Password"}
            </h2>
            <p className="text-navy-500 text-sm mt-1.5">
              {step === "request"
                ? "Enter your university email address and we'll send you a password reset link."
                : "Enter your new password below."}
            </p>
          </div>

          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  University Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@cavendish.ac.zm or @cavendish.co.zm"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <Shield size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <Shield size={15} className="shrink-0 mt-0.5" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={14} /> Send Reset Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              {/* Resend cooldown */}
              {resendCooldown > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <Clock size={16} />
                    <span>
                      Please wait <strong>{resendCooldown}s</strong> before
                      requesting a new link.
                    </span>
                  </div>
                </div>
              )}

              {(!resendCooldown || loading) && (
                <button
                  type="button"
                  onClick={handleResendToken}
                  disabled={loading || resendCooldown > 0}
                  className="w-full text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center justify-center gap-1 transition disabled:opacity-50"
                >
                  <RefreshCw size={14} /> Didn't receive the email? Resend link
                </button>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((o) => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle size={15} className="shrink-0 mt-0.5" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock size={14} /> Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-[11px] text-navy-400 mt-6 leading-relaxed">
            Access is restricted to authorized Cavendish University Zambia
            users.
            <br />
            For account support, contact{" "}
            <span className="text-navy-600 font-medium">
              library@cavendish.ac.zm
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
