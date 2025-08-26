import { useEffect, useRef, useState } from "react"
import ModalShell from "./ModalShell.jsx"
import { getValidAccessToken } from "../utils/auth.js"
import Dropzone from "../components/Dropzone.jsx"

const API_BASE_URL = "http://localhost:8080"

export default function UploadMediaModal({ open, campaignId, onClose, onUploaded }) {
  const [defaultDuration, setDefaultDuration] = useState(5) // seconds
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState([]) // [{fileName, status:'uploading'|'done'|'error', message?}]
  const fileInputRef = useRef(null)
  const isUploading = uploads.some(u => u.status === "uploading")

  useEffect(() => {
    if (!open) {
      setDefaultDuration(5)
      setBusy(false)
      setError(null)
      setUploads([])
    }
  }, [open])

  if (!open) return null

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
      setUploads(prev => prev.map(u => (u === row ? { ...u, status: "error", message: e.message } : u)))
    }
  }

  function onDrop(e) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    files.forEach(f => uploadOneFile(f, defaultDuration))
  }
  function onPick(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(f => uploadOneFile(f, defaultDuration))
    e.target.value = "" // allow re-pick same file later
  }

  const hasAtLeastOneSuccess = uploads.some(u => u.status === "done")

  return (
    <ModalShell
      open={open}
      title="Upload content"
      onClose={() => { if (!busy) onClose?.() }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
            disabled={busy}
            type="button"
          >
            Close
          </button>
          <button
            onClick={() => { onUploaded?.(); onClose?.() }}
            className={`px-4 py-2 rounded-lg text-white disabled:opacity-60 ${
              hasAtLeastOneSuccess ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-300"
            }`}
            disabled={!hasAtLeastOneSuccess}
            type="button"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-5">
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
            busy={isUploading}
            onFiles={(files) => files.forEach(f => uploadOneFile(f, defaultDuration))}
            >
            <p className="mb-2">Drag & drop images/videos here</p>
            <p className="text-sm text-gray-500 mb-4">…or click to pick from your computer</p>
        </Dropzone>         

        {/* Upload list */}
        {uploads.length > 0 && (
          <div className="border rounded-lg">
            <div className="px-4 py-2 border-b text-sm font-medium">Uploads</div>
            <ul className="max-h-56 overflow-auto divide-y">
              {uploads.map((u, i) => (
                <li key={i} className="px-4 py-2 text-sm flex items-center justify-between">
                  <span className="truncate">{u.fileName}</span>
                  <span
                    className={
                      u.status === "done" ? "text-green-600" :
                      u.status === "error" ? "text-red-600" :
                      "text-gray-600"
                    }
                  >
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
  )
}
