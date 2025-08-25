// src/pages/CampaignDetail.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getValidAccessToken } from "../utils/auth.js"

import AssignDevicesModal from "../modals/AssignDevicesModal.jsx"
import UploadMediaModal from "../modals/UploadMediaModal.jsx"

import CampaignSummary from "../components/CampaignSummary.jsx"
import DevicesTable from "../components/DevicesTable.jsx"
import MediaItemsTable from "../components/MediaItemsTable.jsx"

const API_BASE_URL = "http://localhost:8080"

export default function CampaignDetail() {
  const { campaignId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchDetail = useCallback(async () => {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    try {
      setLoading(true); setError(null)
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

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const accountId = useMemo(() => localStorage.getItem("accountId"), [])
  const mediaItems = data?.mediaItems || []

  async function handleDelete() {
    if (!window.confirm("Delete this campaign? This action cannot be undone.")) return
    try {
      setDeleting(true); setDeleteError(null)
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
      <CampaignSummary data={data} />

      {/* Devices */}
      <DevicesTable devices={data?.devices || []} />

      {/* Media items */}
      <MediaItemsTable
        accountId={accountId}
        campaignId={campaignId}
        mediaItems={mediaItems}
        onSaved={fetchDetail}
      />

      {/* Assign devices modal */}
      <AssignDevicesModal
        open={assignOpen}
        campaignId={campaignId}
        preselectedIds={(data?.devices || []).map(d => d.id)}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => { setAssignOpen(false); fetchDetail() }}
      />

      {/* Upload media modal */}
      <UploadMediaModal
        open={uploadOpen}
        campaignId={campaignId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { setUploadOpen(false); fetchDetail() }}
      />
    </div>
  )
}
