// src/pages/Locations.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValidAccessToken } from "../utils/auth.js"

const API_BASE_URL = "http://localhost:8080"

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Locations() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 450)

  // Build query string (?searchTerms=a&searchTerms=b...)
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    const terms = debouncedSearch.trim().split(/\s+/).filter(Boolean)
    for (const t of terms) params.append("searchTerms", t)
    return params.toString()
  }, [debouncedSearch])

  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken()
      const accountId = localStorage.getItem("accountId")
      if (!token || !accountId) { navigate("/"); return }

      try {
        setLoading(true)
        setError(null)
        const url = `${API_BASE_URL}/account/${accountId}/locations${queryString ? `?${queryString}` : ""}`
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) throw new Error((await res.text()) || "Failed to fetch locations")
        const data = await res.json()
        setLocations(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [queryString, navigate])

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Locations</h1>

      {/* Search */}
      <div className="relative mb-4">
        <img
          src={`${import.meta.env.BASE_URL}search.svg`}
          alt=""
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-200"
        />
        <input
          type="text"
          placeholder="Search by name or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-lg pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading && <div className="p-4 text-sm text-gray-600">Loading locations…</div>}
        {error && <div className="p-4 text-sm text-red-600 break-words">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Location Name</th>
                <th className="py-2 px-4 border text-center">Active Devices</th>
                <th className="py-2 px-4 border text-left">Address</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} className="border-t">
                  <td className="py-2 px-4">{loc.name}</td>
                  <td className="py-2 px-4 text-center">
                    {typeof loc.numberOfActiveDevices === "number" ? loc.numberOfActiveDevices : 0}
                  </td>
                  <td className="py-2 px-4">{loc.address || "-"}</td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="3">
                    No locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
