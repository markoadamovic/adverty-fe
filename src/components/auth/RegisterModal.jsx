// src/modals/RegisterModal.jsx
import React, { useEffect, useState } from "react"
import ModalShell from "../../modals/ModalShell"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

async function readErrorMessage(res, fallback = "Something went wrong") {
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

export default function RegisterModal({ open, onClose, onRegistered }) {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // reset when opening
  useEffect(() => {
    if (open) { setUserName(""); setPassword(""); setConfirm(""); setError(null) }
  }, [open])

  // Close on Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && !loading && onClose?.()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, loading, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!userName || !password) return setError("Username and password are required")
    if (password !== confirm) return setError("Passwords do not match")

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      })

      if (!res.ok) {
      const msg = await res.text().catch(() => "")
      throw new Error(msg || "Registration failed")
    }

      onRegistered?.() 
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  // prevent closing while loading
  const safeClose = () => { if (!loading) onClose?.() }

  return (
    <ModalShell
      open={open}
      title="Create account"
      onClose={safeClose}
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoComplete="username"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      {error && <p className="mt-3 text-center text-red-500 text-sm">{error}</p>}
    </ModalShell>
  )
}
