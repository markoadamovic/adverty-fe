// src/pages/CampaignDetail.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getValidAccessToken } from "../utils/auth.js"
import AssignDevicesModal from "../modals/AssignDevicesModal.jsx"
import UploadMediaModal from "../modals/UploadMediaModal.jsx" 

const API_BASE_URL = "http://localhost:8080"

// --- helpers ---
function formatHeartbeat(ldt) {
  if (!ldt) return "-"
  // Backend sends LocalDateTime like "2025-08-23T09:12:33"
  return String(ldt).replace("T", " ")
}
function formatSizeMB(size) {
  if (size == null) return "-"
  const n = Number(size)
  return Number.isFinite(n) ? `${n.toFixed(1)} MB` : String(size)
}

export default function CampaignDetail() {
  const { campaignId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null) // CampaignDto
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // assign devices modal
  const [assignOpen, setAssignOpen] = useState(false)
  // upload media items
  const [uploadOpen, setUploadOpen] = useState(false)
    // --- inline edit state for media items ---
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: "", duration: 0 })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)

  // Fetch details (shared by mount and post-assign refresh)
  const fetchDetail = useCallback(async () => {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error((await res.text()) || "Failed to fetch campaign")
      const dto = await res.json()
      setData({
        ...dto,
        devices: Array.isArray(dto.devices) ? dto.devices : [],
        mediaItems: Array.isArray(dto.mediaItems) ? dto.mediaItems : [],
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [campaignId, navigate])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  // Sort media items by itemOrder
  const mediaItemsSorted = useMemo(() => {
    if (!data?.mediaItems) return []
    return [...data.mediaItems].sort((a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0))
  }, [data])

  // --- inline edit handlers ---
  function startEdit(m) {
    setEditingId(m.id)
    setEditError(null)
    setEditDraft({
      name: m.name ?? "",
      duration: Number.isFinite(m.duration) ? m.duration : 5,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft({ name: "", duration: 0 })
    setEditError(null)
  }

  async function saveEdit(m) {
    const name = (editDraft.name || "").trim()
    const duration = Number(editDraft.duration || 0)

    if (!name) { setEditError("Name is required."); return }
    if (!Number.isFinite(duration) || duration < 1) {
      setEditError("Duration must be a positive integer.")
      return
    }

    try {
      setSavingEdit(true); setEditError(null)
      const token = await getValidAccessToken()
      const accountId = localStorage.getItem("accountId")
      if (!token || !accountId) { navigate("/"); return }

      const orderNumber =
        Number.isFinite(m.itemOrder) ? m.itemOrder : (mediaItemsSorted.findIndex(x => x.id === m.id) + 1)

      const payload = { name, duration, orderNumber }

      const res = await fetch(
        `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}/media/${m.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error((await res.text()) || "Failed to update media item")

      await fetchDetail()
      cancelEdit()
    } catch (e) {
      setEditError(e.message)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this campaign? This action cannot be undone.")) return
    try {
      setDeleting(true)
      setDeleteError(null)
      const token = await getValidAccessToken()
      const accountId = localStorage.getItem("accountId")
      if (!token || !accountId) { navigate("/"); return }

      const res = await fetch(
        `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to delete campaign")
      }
      navigate("/dashboard/campaigns")
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaign</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAssignOpen(true)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-200 cursor-pointer"
            disabled={loading || deleting}
          >
            Configure devices
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-200 cursor-pointer"
            disabled={loading || deleting}
          >
            Upload content
          </button>         
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-200 cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || data?.isDefault}
            title={data?.isDefault ? "Default campaign cannot be deleted" : undefined}
            className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {deleteError && <div className="text-red-600">{deleteError}</div>}

      {/* Summary */}
      {data && (
        <div className="bg-white rounded-xl border p-4 w-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-gray-500 text-sm">Name</div>
              <div className="font-medium">{data.name}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Status</div>
              <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium`}>
                {data.campaignStatus}
              </span>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Default</div>
              <div className="font-medium">{data.isDefault ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Image duration (s)</div>
              <div className="font-medium">{data.imageDuration ?? "-"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Devices */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 border-b font-semibold">Devices</div>
        {!data ? (
          <div className="p-4 text-sm text-gray-600">—</div>
        ) : data.devices.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No devices attached.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-center">Active</th>
                <th className="py-2 px-4 border text-left">Heartbeat</th>
                <th className="py-2 px-4 border text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {data.devices.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="py-2 px-4">{d.name}</td>
                  <td className="py-2 px-4 text-center">{d.active ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{formatHeartbeat(d.heartbeat)}</td>
                  <td className="py-2 px-4">{d.locationName || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Media items */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-3 border-b font-semibold">Media items</div>
        {!data ? (
          <div className="p-4 text-sm text-gray-600">—</div>
        ) : mediaItemsSorted.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No media items.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-center">Order</th>
                <th className="py-2 px-4 border text-left">Name</th>
                <th className="py-2 px-4 border text-left">Ext</th>
                <th className="py-2 px-4 border text-right">Duration (s)</th>
                <th className="py-2 px-4 border text-right">Size</th>
                <th className="py-2 px-4 border text-left">Status</th>
                <th className="py-2 px-4 border text-center">Preview</th>
                <th className="py-2 px-4 border text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaItemsSorted.map((m, idx) => {
                const isEditing = editingId === m.id
                return (
                  <tr key={m.id} className="border-t align-middle">
                    <td className="py-2 px-4 text-center">{m.itemOrder ?? idx + 1}</td>

                    {/* Name (editable) */}
                    <td className="py-2 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full max-w-xs border rounded-lg px-2 py-1"
                          value={editDraft.name}
                          onChange={(e) => setEditDraft(d => ({ ...d, name: e.target.value }))}
                        />
                      ) : (
                        m.name
                      )}
                    </td>

                    <td className="py-2 px-4">{m.extension || "-"}</td>

                    {/* Duration (editable) */}
                    <td className="py-2 px-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          className="w-24 border rounded-lg px-2 py-1 text-right"
                          value={editDraft.duration}
                          onChange={(e) =>
                            setEditDraft(d => ({ ...d, duration: Math.max(1, Number(e.target.value || 1)) }))
                          }
                        />
                      ) : (
                        m.duration ?? "-"
                      )}
                    </td>

                    <td className="py-2 px-4 text-right">{formatSizeMB(m.size)}</td>

                    <td className="py-2 px-4">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium`}>
                        {m.mediaItemStatus}
                      </span>
                    </td>

                    {/* Preview */}
                    <td className="py-2 px-4 text-center">
                      {m.mediaItemUrl ? (
                        <a
                          href={m.mediaItemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                            onClick={() => saveEdit(m)}
                            disabled={savingEdit}
                          >
                            {savingEdit ? "Saving…" : "Save"}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                          onClick={() => startEdit(m)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {editError && (
                <tr>
                  <td colSpan={8} className="px-4 py-2 text-sm text-red-600">{editError}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    
      {/* Assign devices modal */}
      <AssignDevicesModal
        open={assignOpen}
        campaignId={campaignId}
        preselectedIds={(data?.devices || []).map(d => d.id)}  // <= HERE
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
          setAssignOpen(false)
          fetchDetail() // refresh to show newly assigned devices
        }}
      />
      <UploadMediaModal
        open={uploadOpen}
        campaignId={campaignId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false)
          fetchDetail() // refresh media table to show new items
        }}
      />      
    </div>
  )
}
