// src/pages/Campaigns.jsx
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValidAccessToken } from "../utils/auth.js"
import CreateCampaignDialog from "../modals/CreateCampaignDialog.jsx"
import useDebounce from "../utils/useDebounce.js"
import CampaignRow from "../components/CampaignRow.jsx"
import {
  listCampaigns as apiListCampaigns,
  createCampaign as apiCreateCampaign,
  postCampaignAction as apiPostCampaignAction,
  deleteCampaign as apiDeleteCampaign,
} from "../services/campaignApi.js"

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL


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
        const data = await apiListCampaigns({token, accountId})
        setCampaigns(data)
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
      const newId = await apiCreateCampaign({ token, accountId })
      setDraftId(newId)
      setCreateOpen(true)
    } catch (e) {
      alert(e.message)
    }
  }

  async function callCampaignAction(action, c) {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    setActing((m) => ({ ...m, [c.campaignId]: action }))
    try {
      const updated = await apiPostCampaignAction({ 
        token, 
        accountId, 
        campaignId: c.campaignId,
        action
      })
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
    await apiDeleteCampaign({ token, accountId, campaignId: c.campaignId })

    // Optimistically remove from the list
    setCampaigns(prev => prev.filter(x => x.campaignId !== c.campaignId))
  } catch (err) {
    alert(err.message || "Unable to delete campaign")
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
              <CampaignRow
                key={c.campaignId}
                campaign={c}
                onRowClick={goToCampaign}
                onDeploy={handleDeploy}
                onPlay={handlePlay}
                onStop={handleStop}
                onDelete={handleDelete}
              />
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
