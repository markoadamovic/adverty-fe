// src/utils/campaignActions.js
export const S = (s) => String(s || "").toUpperCase()

export const canDeploy = (c) => {
  const st = S(c.campaignStatus)
  return st === "PREPARED" || st === "RETIRED" || st === "UPLOAD_ERROR"
}
export const canPlay = (c) => S(c.campaignStatus) === "READY"
export const canStop = (c) => {
  const st = S(c.campaignStatus)
  return st === "RUNNING" || st === "PARTIALLY_RUNNING"
}
// Whitelist (so DEPLOYING/PREPARED/READY won’t show Delete)
export const canDelete = (c) => {
  const st = S(c.campaignStatus)
  return (
    st === "RUNNING" ||
    st === "PARTIALLY_RUNNING" ||
    st === "RETIRED" ||
    st === "UPLOAD_ERROR" ||
    st === "DOWNLOAD_ERROR"
  )
}
