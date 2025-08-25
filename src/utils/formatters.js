// src/utils/formatters.js
export function formatHeartbeat(ldt) {
  if (!ldt) return "-"
  return String(ldt).replace("T", " ")
}

export function formatSizeMB(size) {
  if (size == null) return "-"
  const n = Number(size)
  return Number.isFinite(n) ? `${n.toFixed(1)} MB` : String(size)
}
