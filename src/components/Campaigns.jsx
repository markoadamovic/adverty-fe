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
  const [acting, setActing] = useState({})

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


  const S = (s) => String(s || "").toUpperCase()
  const canDeploy = (c) => {
    const st = S(c.campaignStatus)
    return st === "PREPARED" || st === "RETIRED" || st === "UPLOAD_ERROR"
  }
  const canPlay = (c) => S(c.campaignStatus) === "READY"
  const canStop = (c) => {
    const st = S(c.campaignStatus)
    return st === "RUNNING" || st === "PARTIALLY_RUNNING"
  }
  const canDelete = (c) => {
    const st = S(c.campaignStatus)
    return (
      st !== "RUNNING" ||
      st !== "PARTIALLY_RUNNING" ||
      st !== "DEPLOYING"
    )
  }

  // action handlers (wire APIs after you share them)
  const stopRow = (e) => { e.stopPropagation(); e.preventDefault() }

  async function callCampaignAction(action, c) {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    setActing((m) => ({ ...m, [c.campaignId]: action }))
    try {
      const url = `${API_BASE_URL}/account/${accountId}/campaign/${c.campaignId}/${action}`
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Failed to ${action} campaign`)
      }
      const updated = await res.json().catch(() => null)
      if (updated?.campaignId) {
        setCampaigns((prev) =>
          prev.map((x) => (x.campaignId === updated.campaignId ? { ...x, ...updated } : x))
        )
      }
    } catch (err) {
      alert(err.message || `Unable to ${action} campaign`)
    } finally {
      setActing((m) => {
        const { [c.campaignId]: _, ...rest } = m
        return rest
      })
    }
  }

  const handleDeploy = (c) => callCampaignAction("deploy", c)
  const handlePlay   = (c) => callCampaignAction("play", c)
  const handleStop   = (c) => callCampaignAction("stop", c)

  const handleDelete = async (c) => {
  // Optional confirmation
  const ok = window.confirm(`Delete campaign "${c.name}"? This cannot be undone.`)
  if (!ok) return

  const token = await getValidAccessToken()
  const accountId = localStorage.getItem("accountId")
  if (!token || !accountId) { navigate("/"); return }

  try {
    const url = `${API_BASE_URL}/account/${accountId}/campaign/${c.campaignId}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    // 204 No Content is expected on success
    if (res.status !== 204 && !res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || "Failed to delete campaign")
    }

    // Optimistically remove from the list
    setCampaigns(prev => prev.filter(x => x.campaignId !== c.campaignId))
  } catch (err) {
    alert(err.message || "Unable to delete campaign")
  }
}

  // small button component
  const ActionButton = ({ label, title, variant = "default", onClick }) => {
    const base =
      "px-2 py-1 text-xs rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-1"
    const styles = {
      default: `${base} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`,
      success: `${base} bg-green-600 text-white border-green-600 hover:bg-green-700`,
      warn: `${base} bg-orange-600 text-white border-orange-600 hover:bg-orange-700`,
      danger: `${base} bg-rose-600 text-white border-rose-600 hover:bg-rose-700`,
    }
    return (
      <button
        type="button"
        title={title}
        className={styles[variant] || styles.default}
        onClick={onClick}
      >
        {label}
      </button>
    )
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
              <col className="w-1/4" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-left">Status</th>
                <th className="py-2 px-4 border text-left">Number of devices</th>
                <th className="py-2 px-4 border text-left">Actions</th>
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

                  {/* Actions */}
                  <td className="py-2 px-4 text-left">
                    <div className="flex items-center gap-2">
                      {canDelete(c) && (
                        <ActionButton
                          label="Delete"
                          title="Delete campaign"
                          variant="danger"
                          onClick={(e) => { stopRow(e); handleDelete(c) }}
                        />
                      )}
                      {canDeploy(c) && (
                        <ActionButton
                          label="Deploy"
                          title="Deploy campaign"
                          variant="default"
                          onClick={(e) => { stopRow(e); handleDeploy(c) }}
                        />
                      )}
                      {canPlay(c) && (
                        <ActionButton
                          label="Play"
                          title="Start playback"
                          variant="success"
                          onClick={(e) => { stopRow(e); handlePlay(c) }}
                        />
                      )}
                      {canStop(c) && (
                        <ActionButton
                          label="Stop"
                          title="Stop playback"
                          variant="warn"
                          onClick={(e) => { stopRow(e); handleStop(c) }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="4">
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
