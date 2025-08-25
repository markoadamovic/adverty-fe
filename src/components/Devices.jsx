// src/components/Devices.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import MultiSelectDropdown from "./MultiSelectDropdown.jsx"
import { getValidAccessToken } from "../utils/auth.js"

const API_BASE_URL = "http://localhost:8080"
const accountId = localStorage.getItem("accountId")

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const Devices = () => {
  const navigate = useNavigate()

  const [devices, setDevices] = useState([])
  const [filters, setFilters] = useState({
    locationNames: [],
    campaignNames: [],
    campaignStatuses: [],
  })

  const [selected, setSelected] = useState({
    locationNames: new Set(),
    campaignNames: new Set(),
    campaignStatuses: new Set(),
    activeOnly: false,
  })

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 450)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    for (const v of selected.locationNames) params.append("locationNames", v)
    for (const v of selected.campaignNames) params.append("campaignNames", v)
    for (const v of selected.campaignStatuses) params.append("campaignStatuses", v)
    if (debouncedSearch?.trim()) params.append("searchTerms", debouncedSearch.trim())
    if (selected.activeOnly) params.append("active", "true")
    params.append("page", String(page))
    params.append("size", String(size))
    return params.toString()
  }, [selected, debouncedSearch, page, size])

  // Load filter options
  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken()
      if (!token) { navigate("/"); return }

      try {
        setError(null)
        const res = await fetch(`${API_BASE_URL}/account/${accountId}/filter`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error((await res.text()) || "Failed to load filters")

        const data = await res.json()
        setFilters({
          locationNames: data.locationNames ?? [],
          campaignNames: data.campaignNames ?? [],
          campaignStatuses: data.campaignStatuses ?? [],
        })
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [navigate])

  // Fetch devices
  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken()
      if (!token) { navigate("/"); return }

      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `${API_BASE_URL}/account/${accountId}/devices?${queryString}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )
        if (!res.ok) throw new Error((await res.text()) || "Failed to fetch devices")

        const data = await res.json()
        setDevices(Array.isArray(data?.content) ? data.content : [])
        setTotalPages(typeof data?.totalPages === "number" ? data.totalPages : 0)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [queryString, navigate])

  const clearAll = () => {
    setSelected({
      locationNames: new Set(),
      campaignNames: new Set(),
      campaignStatuses: new Set(),
      activeOnly: false,
    })
    setSearchTerm("")
    setPage(0)
  }

  const nextPage = () => page + 1 < totalPages && setPage((p) => p + 1)
  const prevPage = () => page > 0 && setPage((p) => p - 1)

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Devices</h1>

      {/* Filters Panel */}
      <div className="bg-white rounded-xl mb-6">
        <div className="grid grid-cols-4 gap-4">
          {/* Search + Active */}
          <div>
            <div className="relative">
              {/* left icon */}
              <img
                src={`${import.meta.env.BASE_URL}search.svg`}
                alt=""
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-200"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(0)
                }}
                placeholder="Search"
                className="w-full border rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search devices"
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                id="activeOnly"
                type="checkbox"
                checked={selected.activeOnly}
                onChange={(e) => setSelected((s) => ({ ...s, activeOnly: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="activeOnly" className="text-sm">Active only</label>
            </div>

            <button
              onClick={clearAll}
              className="mt-3 text-sm text-blue-700 hover:underline"
            >
              Clear all
            </button>
          </div>


          {/* Locations */}
          <div>
            <MultiSelectDropdown
              options={filters.locationNames}
              selectedValues={selected.locationNames}
              onChange={(nextSet) => {
                setSelected((prev) => ({ ...prev, locationNames: nextSet }))
                setPage(0)
              }}
              placeholder="Location"
            />
          </div>

          {/* Campaigns */}
          <div>
            <MultiSelectDropdown
              options={filters.campaignNames}
              selectedValues={selected.campaignNames}
              onChange={(nextSet) => {
                setSelected((prev) => ({ ...prev, campaignNames: nextSet }))
                setPage(0)
              }}
              placeholder="Campaign"
            />
          </div>

          {/* Statuses */}
          <div>
            <MultiSelectDropdown
              options={filters.campaignStatuses}
              selectedValues={selected.campaignStatuses}
              onChange={(nextSet) => {
                setSelected((prev) => ({ ...prev, campaignStatuses: nextSet }))
                setPage(0)
              }}
              placeholder="Status"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading && <div className="p-4 text-sm text-gray-600">Loading devices…</div>}
        {error && <div className="p-4 text-sm text-red-600 break-words">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Active</th>
                <th className="py-2 px-4 border">Heartbeat</th>
                <th className="py-2 px-4 border">Campaign</th>
                <th className="py-2 px-4 border">Location</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="text-center border-t">

                  <td className="py-2 px-4">{d.name}</td>
                  <td className="py-2 px-4">{d.active ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{d.heartbeat ? String(d.heartbeat) : "-"}</td>
                  <td className="py-2 px-4">{d.campaignName || "-"}</td>
                  <td className="py-2 px-4">{d.locationName || "-"}</td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="6">
                    No devices match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value))
              setPage(0)
            }}
            className="border rounded-lg px-2 py-1"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
          <button
            onClick={prevPage}
            disabled={page <= 0}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={nextPage}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}

export default Devices
