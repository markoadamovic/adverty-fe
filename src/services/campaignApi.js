const API_BASE_URL = "http://localhost:8080"

export async function getCampaigns({ token, accountId }) {
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
  return Array.isArray(data) ? data : []
}

export async function createCampaign({ token, accountId }) {
  const res = await fetch(`${API_BASE_URL}/account/${accountId}/campaign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error((await res.text()) || "Failed to create empty campaign")

  let created = null
  try { created = await res.json() } catch {}

  let newId = created?.campaignId
  if (!newId) {
    const loc = res.headers.get("Location")
    if (loc) newId = loc.split("/").pop()
  }
  if (!newId) throw new Error("Server did not return campaignId")
  return newId
}

export async function postCampaignAction({ token, accountId, campaignId, action }) {
  const url = `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}/${action}`
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Failed to ${action} campaign`)
  }
  const updated = await res.json().catch(() => null)
  return updated
}

export async function deleteCampaign({ token, accountId, campaignId }) {
  const url = `${API_BASE_URL}/account/${accountId}/campaign/${campaignId}`
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status !== 204 && !res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "Failed to delete campaign")
  }
  return true
}
