// src/pages/Login.jsx
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import RegisterModal from "./auth/RegisterModal.jsx"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

async function readErrorMessage(res, fallback = "Login failed") {
  const ct = res.headers.get("content-type") || ""
  try {
    if (ct.includes("application/json")) {
      const j = await res.json()
      return j?.message || j?.error || fallback
    } else {
      const t = await res.text()
      try { const j = JSON.parse(t); return j?.message || j?.error || fallback } catch {}
      return t || fallback
    }
  } catch { return fallback }
}

export default function Login() {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      })
      if (!res.ok) throw new Error(await readErrorMessage(res, "Login failed"))
      const data = await res.json()

      const decoded = jwtDecode(data.accessToken)
      const accountId = decoded?.account?.id
      if (!accountId) throw new Error("accountId missing in token payload")

      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("accountId", accountId)

      navigate("/dashboard/devices")
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRegistered = () => {
    setFlash("Registration successful. You can log in now.")
    if (location.pathname !== "/login") {
      // Coming from another page → go to Login, show success message
      setFlash("Registration successful. You can log in now.")
      navigate("/login", { replace: true, state: { registered: true } })
    } else {
      // Already on Login (modal on top of Login) → just show a banner
      setFlash("Registration successful. You can log in now.")
    }
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

          {flash && <p className="mb-4 text-center text-green-600 text-sm">{flash}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Don’t have an account? </span>
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Register
            </button>
          </div>
        </div>
      </div>

      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onRegistered={handleRegistered}
      />
    </>
  )
}
