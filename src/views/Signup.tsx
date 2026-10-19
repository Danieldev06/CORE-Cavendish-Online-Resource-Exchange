// src/views/Signup.tsx
import { useState, useEffect } from "react"
import {
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  GraduationCap,
  Users,
  UserPlus,
  Loader2,
} from "lucide-react"
import { useApp } from "../context"
import { authApi, api, extractApiError } from "../services/api"
import type { User, Department, Program } from "../types"

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

const YEARS = ["1", "2", "3", "4", "5", "6"]

export default function Signup() {
  const { login, navigate } = useApp()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    faculty: "",
    program: "",
    year: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  const [showPass, setShowPass] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Dynamic data from API
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [loadingPrograms, setLoadingPrograms] = useState(false)

  // Load departments on mount
  useEffect(() => {
    api
      .getDepartments()
      .then(setDepartments)
      .catch((err) => console.error("Failed to load departments:", err))
      .finally(() => setLoadingDepartments(false))
  }, [])

  // Load programs when faculty changes
  useEffect(() => {
    if (!formData.faculty) {
      setPrograms([])
      setFormData((prev) => ({ ...prev, program: "" }))
      return
    }
    // Find department ID from selected faculty code
    const selectedDept = departments.find((d) => d.code === formData.faculty)
    if (!selectedDept) {
      setPrograms([])
      setLoadingPrograms(false)
      return
    }
    setLoadingPrograms(true)
    api
      .getPrograms(selectedDept.id)
      .then(setPrograms)
      .catch((err) => console.error("Failed to load programs:", err))
      .finally(() => setLoadingPrograms(false))
  }, [formData.faculty, departments])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "faculty") {
      setFormData((prev) => ({ ...prev, program: "" }))
    }
    if (name === "role") {
      setFormData((prev) => ({
        ...prev,
        program: "",
        year: "",
        faculty: "",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const {
      firstName,
      lastName,
      email,
      studentId,
      faculty,
      program,
      year,
      role,
      password,
      confirmPassword,
    } = formData

    if (!firstName || !lastName || !email || !studentId || !password || !role) {
      setError("Please fill in all required fields.")
      return
    }

    // Role-specific validation
    if (role === "student") {
      if (!faculty || !program || !year) {
        setError("Students must select Faculty, Programme, and Year of Study.")
        return
      }
    } else if (role === "lecturer") {
      if (!faculty) {
        setError("Lecturers must select a Faculty/School.")
        return
      }
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service.")
      return
    }

    // ✅ Updated email validation — accepts all Cavendish domains
    const isValidEmail =
      email.endsWith("@cavendish.ac.zm") ||
      email.endsWith("@students.cavendish.ac.zm") ||
      email.endsWith("@cavendish.co.zm") ||
      email.endsWith("@students.cavendish.co.zm")

    if (!isValidEmail) {
      setError(
        "Please use your Cavendish University email address (e.g., @cavendish.ac.zm or @students.cavendish.co.zm).",
      )
      return
    }

    setLoading(true)

    try {
      // ✅ Call Django backend to register
      const response = await authApi.register({
        first_name: firstName,
        last_name: lastName,
        email: email,
        student_id: studentId,
        faculty: faculty || "",
        program: program || "",
        year: year || "",
        role: role,
        password: password,
      })

      // Map the Django user to the frontend User shape
      const apiUser = response.user
      const newUser: User = {
        id: String(apiUser.id),
        name:
          `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.email,
        email: apiUser.email,
        role: apiUser.role,
        studentId: apiUser.student_id,
        programme: apiUser.program,
        department: apiUser.faculty,
        school: departments.find((d) => d.code === apiUser.faculty)?.name || "",
        yearOfStudy: apiUser.year,
        status: "active",
        dateJoined: new Date().toISOString(),
      }

      // Login (persists token in localStorage) - handles redirect internally
      login(
        newUser,
        response.token,
        role === "lecturer" ? "select-courses" : undefined,
      )
      // Navigation happens in login(), no need for success screen
    } catch (err: any) {
      // Parse Django validation errors
      let msg = "Signup failed. Please try again."
      try {
        const parsed = JSON.parse(err.message)
        if (typeof parsed === "object") {
          msg = Object.entries(parsed)
            .map(
              ([field, errors]) =>
                `${field}: ${
                  Array.isArray(errors) ? errors.join(", ") : errors
                }`,
            )
            .join(" | ")
        }
      } catch {
        msg = err.message || msg
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const showStudentFields = formData.role === "student"
  const showLecturerFields = formData.role === "lecturer"

  const showFacultyField = showStudentFields || showLecturerFields

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel — same as login */}
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
              Join the CORE
              <br />
              Community Today.
            </h1>
            <p className="text-white/45 text-sm leading-relaxed mb-10">
              Create your account and start accessing academic resources across
              all schools and programmes.
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

      {/* Right panel — signup form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
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

          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-navy-900 leading-tight">
              Create Your Account
            </h2>
            <p className="text-navy-500 text-sm mt-1.5">
              Join the academic repository of Cavendish University Zambia.
            </p>
          </div>

          {/* Success screen removed - navigation handled by login() */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Mwansa"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                University Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourname@cavendish.ac.zm or @cavendish.co.zm"
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                required
              />
              <p className="text-[10px] text-navy-400 mt-1">
                Use your @cavendish.ac.zm, @students.cavendish.ac.zm,
                @cavendish.co.zm, or @students.cavendish.co.zm email
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                {formData.role === "student" ? "Student ID" : "Staff ID"}
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder={
                  formData.role === "student"
                    ? "e.g., 20210001"
                    : "e.g., STF-001"
                }
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                Role / Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                required
              >
                <option value="">Select Role</option>
                <option value="student">🎓 Student</option>
                <option value="lecturer">👨‍🏫 Lecturer</option>
                <option value="admin">📚 Librarian / Admin</option>
              </select>
            </div>

            {/* Faculty/School - shown for student and lecturer */}
            {showFacultyField && (
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Faculty / School
                </label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  disabled={loadingDepartments}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white disabled:opacity-50"
                  required={showFacultyField}
                >
                  <option value="">
                    {loadingDepartments
                      ? "Loading faculties..."
                      : "Select Faculty"}
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Programme - only for students */}
            {showStudentFields && formData.faculty && (
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Programme
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  disabled={loadingPrograms || !formData.faculty}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white disabled:opacity-50"
                  required={showStudentFields}
                >
                  <option value="">
                    {loadingPrograms
                      ? "Loading programmes..."
                      : "Select Programme"}
                  </option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year of Study - only for students */}
            {showStudentFields && (
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Year of Study
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                  required={showStudentFields}
                >
                  <option value="">Select Year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((o) => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-navy-400 mt-1">
                  Minimum 8 characters with letters and numbers
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-navy-600 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-navy-300 accent-navy-800 cursor-pointer"
                required
              />
              <label className="text-xs text-navy-500 leading-relaxed cursor-pointer">
                I agree to the{" "}
                <span className="text-navy-700 font-medium hover:underline cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-navy-700 font-medium hover:underline cursor-pointer">
                  Privacy Policy
                </span>
                . I confirm I am a student or faculty member of Cavendish
                University Zambia.
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <Shield size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating
                  Account...
                </>
              ) : (
                <>
                  <UserPlus size={14} /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Already have an account?{" "}
            <button
              onClick={() => navigate("login")}
              className="text-navy-800 font-semibold hover:underline transition bg-transparent border-none cursor-pointer"
            >
              Sign in here
            </button>
          </p>

          <p className="text-center text-[11px] text-navy-400 mt-4 leading-relaxed">
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
