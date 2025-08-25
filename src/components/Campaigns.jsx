// src/pages/Campaigns.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValidAccessToken } from "../utils/auth.js"
import CreateCampaignDialog from "../modals/CreateCampaignDialog.jsx"

const API_BASE_URL = "http://localhost:8080"

// debounce like in Locations
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Campaigns() {
  const navigate = useNavigate()

  // list state
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // search
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)

  // create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [draftId, setDraftId] = useState(null) // <-- id of the empty campaign we just created

  // fetch data
  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken()
      const accountId = localStorage.getItem("accountId")
      if (!token || !accountId) { navigate("/"); return }

      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/account/${accountId}/campaign`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || "Failed to fetch campaigns")
        }
        const data = await res.json()
        setCampaigns(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  // filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return campaigns
    return campaigns.filter((c) => {
      const name = (c.name || "").toLowerCase()
      const status = (c.campaignStatus || "").toLowerCase()
      return name.includes(q) || status.includes(q)
    })
  }, [campaigns, debouncedSearch])

  // row click
  function goToCampaign(c) {
    navigate(`/dashboard/campaigns/${c.campaignId}`)
  }

  // CLICK: Create campaign → create empty on server → open modal with that id
  async function openCreate() {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    try {
      const res = await fetch(`${API_BASE_URL}/account/${accountId}/campaign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to create empty campaign")

      let created = null
      try { created = await res.json() } catch {}
      // prefer JSON id, fallback to Location header if needed
      let newId = created?.campaignId
      if (!newId) {
        const loc = res.headers.get("Location") // e.g. .../campaign/123
        if (loc) newId = loc.split("/").pop()
      }
      if (!newId) throw new Error("Server did not return campaignId")

      setDraftId(newId)
      setCreateOpen(true)
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Campaigns</h1>

      <div className="mb-4 mt-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          <span className="text-lg leading-none">＋</span>
          <span>Create campaign</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow">
        {loading && <div className="p-4 text-sm text-gray-600">Loading campaigns…</div>}
        {error && <div className="p-4 text-sm text-red-600 break-words">{error}</div>}
        {!loading && !error && (
          <table className="min-w-full">
            <colgroup>
              <col className="w-1/4" />   
              <col className="w-1/4" />    
              <col className="w-1/4" />    
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-left">Status</th>
                <th className="py-2 px-4 border text-left">Number of devices</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.campaignId}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => goToCampaign(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goToCampaign(c)}
                >
                  <td className="py-2 px-4 text-left">{c.name}</td>
                  <td className="py-2 px-4 text-left">
                    <span className="inline-block px-2 py-1 rounded-md text-xs font-medium">
                      {c.campaignStatus}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-left">
                    {typeof c.numberOfDevices === "number" ? c.numberOfDevices : 0}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="3">
                    No campaigns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CreateCampaignDialog
        open={createOpen && !!draftId}
        campaignId={draftId}
        onClose={() => {
          setCreateOpen(false)
          setDraftId(null) // optional but tidy
        }}
        onDone={(newId) => {
          setCreateOpen(false)   // close modal when dialog calls onDone
          setDraftId(null)
          if (newId) navigate(`/dashboard/campaigns/${newId}`) // or refetch list if you prefer
        }}
      />
    </>
  )
}
