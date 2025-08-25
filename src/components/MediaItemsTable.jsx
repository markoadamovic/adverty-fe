// src/components/MediaItemsTable.jsx
import React, { useMemo, useState } from "react"
import { getValidAccessToken } from "../utils/auth.js"
import { formatSizeMB } from "../utils/formatters.js"

const API_BASE_URL = "http://localhost:8080"

export default function MediaItemsTable({ accountId, campaignId, mediaItems = [], onSaved }) {
  // local editing state (kept here, not in the page)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: "", duration: 0 })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)

  const mediaItemsSorted = useMemo(() => {
    return [...(mediaItems || [])].sort(
      (a, b) => (a.itemOrder ?? 0) - (b.itemOrder ?? 0)
    )
  }, [mediaItems])

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
      if (!token || !accountId) return

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

      onSaved?.()       // tell the page to refresh data
      cancelEdit()
    } catch (e) {
      setEditError(e.message)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <div className="px-4 py-3 border-b font-semibold">Media items</div>
      {!mediaItemsSorted.length ? (
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
                    <span className="inline-block px-2 py-1 rounded-md text-xs font-medium">
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
  )
}
