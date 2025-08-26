// src/modals/CreateCampaignDialog.jsx
import React, { useEffect, useState, useMemo } from "react"
import ModalShell from "./ModalShell.jsx"
import AssignDevicesModal from "./AssignDevicesModal.jsx"
import { getValidAccessToken } from "../utils/auth.js"
import Dropzone from "../components/Dropzone.jsx"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export default function CreateCampaignDialog({ open, campaignId, onClose, onDone }) {
  const [name, setName] = useState("")
  const [defaultDuration, setDefaultDuration] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState([]) // [{fileName, status, message?}]
  const isUploading = uploads.some(u => u.status === "uploading")

   const hasUploadedContent = useMemo(
    () => uploads.some(u => u.status === "done"),
    [uploads]
  )

  const [assignOpen, setAssignOpen] = useState(false)

  // Reset when closed or when we get a fresh campaignId
  useEffect(() => {
    if (!open) {
      setName("")
      setError(null)
      setUploads([])
      setDefaultDuration(5)
      setAssignOpen(false)
    }
  }, [open, campaignId])

  if (!open || !campaignId) return null

  async function uploadOneFile(file, durationSeconds) {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { onClose?.(); return }

    const row = { fileName: file.name, status: "uploading" }
    setUploads(prev => [row, ...prev])

    try {
      const form = new FormData()
      form.append("file", file)
      form.append("duration", String(durationSeconds))

      const res = await fetch(
        `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}/media`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
      )
      if (!res.ok) throw new Error((await res.text()) || `Failed to upload ${file.name}`)

      setUploads(prev => prev.map(u => (u === row ? { ...u, status: "done" } : u)))
    } catch (e) {
      setUploads(prev =>
        prev.map(u => (u === row ? { ...u, status: "error", message: e.message } : u))
      )
    }
  }

  async function onCancel() {
    try {
        const token = await getValidAccessToken()
        const accountId = localStorage.getItem("accountId")
        if (!token || !accountId) { onClose?.(); return }

        await fetch(
          `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        )
    } catch (e) {
        setError(e.message)
        setBusy(false)
        return
      } finally {
        onClose(true)
      }
  }

  async function saveAndClose() {
    const trimmed = name.trim()
    if (trimmed) {
      try {
        setBusy(true); setError(null)
        const token = await getValidAccessToken()
        const accountId = localStorage.getItem("accountId")
        if (!token || !accountId) { onClose?.(); return }

        const qs = new URLSearchParams({ name: trimmed }).toString()
        const res = await fetch(
          `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}/name?${qs}`,
          { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) throw new Error((await res.text()) || "Failed to update campaign name")
      } catch (e) {
        setError(e.message)
        setBusy(false)
        return
      } finally {
        setBusy(false)
      }
    }
    onDone?.(campaignId) // parent closes & navigates
  }

  return (
    <>
      <ModalShell
        open={open}
        title="Create campaign & upload"
        onClose={onCancel}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setAssignOpen(true)}
              className={`
                px-4 py-2 rounded-lg 
                ${hasUploadedContent 
                    ? "bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"  
                    : "bg-gray-200 text-gray-400 cursor-pointer"}  
               `}
              disabled={busy || !hasUploadedContent}
              type="button"
            >
              Configure devices
            </button>
            <button
              onClick={saveAndClose}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 cursor-pointer"
              disabled={busy}
              type="button"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border hover:bg-gray-200 disabled:opacity-60 cursor-pointer"
              disabled={busy}
              type="button"
            >
              Cancel
            </button>
          </div>
        }
      >
        {/* Body */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Campaign name"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Default duration */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Default duration (s) for uploads</label>
            <input
              type="number"
              min={1}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(Math.max(1, Number(e.target.value || 1)))}
              className="w-24 border rounded-lg px-2 py-1"
            />
          </div>

          <Dropzone
            busy={isUploading   }
            onFiles={(files) => files.forEach(f => uploadOneFile(f, defaultDuration))}
            >
            <p className="mb-2">Drag & drop images/videos here</p>
            <p className="text-sm text-gray-500 mb-4">…or click to pick from your computer</p>
          </Dropzone>       

          {/* Upload list */}
          {uploads.length > 0 && (
            <div className="border rounded-lg">
              <ul className="max-h-56 overflow-auto divide-y">
                {uploads.map((u, i) => (
                  <li key={i} className="px-4 py-2 text-sm flex items-center justify-between">
                    <span className="truncate">{u.fileName}</span>
                    <span className={
                      u.status === "done" ? "text-green-600" :
                      u.status === "error" ? "text-red-600" :
                      "text-gray-600"
                    }>
                      {u.status === "uploading" && "Uploading…"}
                      {u.status === "done" && "Uploaded"}
                      {u.status === "error" && (u.message || "Failed")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </ModalShell>

      {/* Child modal (no preselectedIds for new campaigns) */}
      <AssignDevicesModal
        open={assignOpen}
        campaignId={campaignId}
        preselectedIds={[]}   
        onClose={() => setAssignOpen(false)}
        onAssigned={() => {
            // 1) close child
            setAssignOpen(false)
            // 2) signal parent page to close CreateCampaignDialog too
            onDone?.(campaignId)
        }}      
      />
    </>
  )
}
