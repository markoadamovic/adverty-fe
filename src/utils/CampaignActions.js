// keep S internal; export only the can* helpers
const S = (s) => String(s || "").toUpperCase()

export const canDeploy = (c) => {
  const st = S(c.campaignStatus)
  return st === "PREPARED" || st === "RETIRED" || st === "UPLOAD_ERROR"
}

export const canPlay = (c) => S(c.campaignStatus) === "READY"

export const canStop = (c) => {
  const st = S(c.campaignStatus)
  return st === "RUNNING" || st === "PARTIALLY_RUNNING"
}

export const canDelete = (c) => {
  const st = S(c.campaignStatus)
  return (
    st !== "RUNNING" &&
    st !== "PARTIALLY_RUNNING" &&
    st !== "DEPLOYING"
  )
}
