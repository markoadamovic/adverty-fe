import { useState, useCallback, useEffect } from "react"
import { getValidAccessToken } from "../utils/auth.js"

export function useCampaignDetail(campaignId, navigate) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDetail = useCallback(async () => {
    const token = await getValidAccessToken()
    const accountId = localStorage.getItem("accountId")
    if (!token || !accountId) { navigate("/"); return }

    try {
      setLoading(true); setError(null)
      const res = await fetch(
        `http://localhost:8080/account/${accountId}/campaign/${campaignId}`,
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

  return { data, loading, error, fetchDetail }
}
