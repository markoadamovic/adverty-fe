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

// Normalize 0..1 or 0..100 into 0..100
export function normalizePercent(v) {
  if (v == null) return 0;
  const num = Number(v);
  if (!Number.isFinite(num)) return 0;
  const pct = num <= 1 ? num * 100 : num;
  return Math.max(0, Math.min(100, pct));
}

