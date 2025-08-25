// src/modals/AssignDevicesModal.jsx
import React, { useEffect, useMemo, useState } from "react"
import ModalShell from "./ModalShell.jsx"
import { getValidAccessToken } from "../utils/auth.js"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export default function AssignDevicesModal({
  open,
  campaignId,
  preselectedIds,
  onClose,
  onAssigned, // callback after successful assign
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [prepared, setPrepared] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // NEW: location filter
  const [selectedLocation, setSelectedLocation] = useState("ALL")

  // Reset state every time we open
  useEffect(() => {
    if (open) {
      setError(null)
      setDevices([])
      setSelected(new Set(preselectedIds))
      setPrepared(false)
      setSelectedLocation("ALL")
    }
  }, [open, preselectedIds])

  // Fetch available devices when modal opens
  useEffect(() => {
    if (!open) return
    (async () => {
      try {
        setLoading(true); setError(null)
        const token = await getValidAccessToken()
        const accountId = localStorage.getItem("accountId")
        if (!token || !accountId) { onClose?.(); return }

        const res = await fetch(`${API_BASE_URL}/account/${accountId}/available-devices`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error((await res.text()) || "Failed to load devices")

        const list = await res.json()
        setDevices(Array.isArray(list) ? list : [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [open, onClose])

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function handleAssign() {
    try {
      setSubmitting(true); setError(null)
      const token = await getValidAccessToken()
      const accountId = localStorage.getItem("accountId")
      if (!token || !accountId) { onClose?.(); return }

      const body = {
        deviceIds: Array.from(selected),
        prepared: Boolean(prepared),
      }

      const res = await fetch(
        `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}/devices`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) throw new Error((await res.text()) || "Failed to assign devices")

      onAssigned?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Location options
  const locations = useMemo(() => {
    const set = new Set()
    for (const d of devices) set.add(d.locationName)
    return ["ALL", ...Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )]
  }, [devices])

  // --- Filtered list based on selectedLocation
  const filtered = useMemo(() => {
    if (selectedLocation === "ALL") return devices
    return devices.filter(d => (d.locationName) === selectedLocation)
  }, [devices, selectedLocation])

  if (!open) return null

  return (
    <ModalShell
      open={open}
      title="Assign devices to campaign"
      onClose={() => { if (!submitting) onClose?.() }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={submitting}
          >
            Submit
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Location</label>
            <select
              className="border rounded-lg px-2 py-1"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc === "ALL" ? "All locations" : loc}
                </option>
              ))}
            </select>
          </div>

          {/* Prepared toggle (keep if you use it) */}
          <button onClick={clearSelection} className="ml-auto px-3 py-2 rounded-lg border hover:bg-gray-100">
            Clear selection
          </button>
        </div>

        {/* List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b text-sm font-medium bg-gray-50">
            {loading ? "Loading devices…" : `Devices (${filtered.length})`}
          </div>

          {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}

          {!loading && !error && filtered.length > 0 && (
            <ul className="max-h-72 overflow-auto divide-y">
              {filtered.map((d) => (
                <li key={d.id} className="px-4 py-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggleOne(d.id)}
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {(d.locationName || "(No location)")} • {d.active ? "Active" : "Inactive"}
                      {d.campaignName ? ` • in: ${d.campaignName}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-600">
              No devices for this location.
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  )
}
