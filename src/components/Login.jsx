import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

const API_BASE_URL = "http://localhost:8080"  // Spring Boot backend

const Login = () => {
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)

  const navigate = useNavigate() 

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(`${API_BASE_URL}/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()

      const decoded = jwtDecode(data.accessToken)
      const accountId = decoded?.account?.id

      if (!accountId) {
        throw new Error("accountId missing in token payload (expected decoded.account.id)")
      }   

      // Save tokens
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("accountId", accountId)

      navigate("/dashboard/devices")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
        {error && (
          <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  )
}

export default Login
