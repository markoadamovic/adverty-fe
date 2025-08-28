import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getValidAccessToken } from "../../utils/auth"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Label,
} from "recharts"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

const COLORS = {
  used: { good: "#22c55e", warn: "#f59e0b", bad: "#ef4444" }, // green/amber/red
  free: "#e5e7eb", // gray-200
}

export default function HomeDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()
  const goToCampaign = (id) => navigate(`/dashboard/campaigns/${encodeURIComponent(id)}`)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null)
        const token = await getValidAccessToken()
        const accountId = localStorage.getItem("accountId")
        if (!token || !accountId) {
          navigate("/login", { replace: true })
          return
        }

        const res = await fetch(`${API_BASE_URL}/account/${accountId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error((await res.text()) || "Failed to load dashboard")
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate])

  // ---- helpers
  const normalizePercent = (v) => {
    if (v == null) return 0
    const num = Number(v)
    if (!Number.isFinite(num)) return 0
    const pct = num <= 1 ? num * 100 : num
    return Math.max(0, Math.min(100, pct))
  }

  const storagePct = normalizePercent(data?.storageUsage)
  const usedColor =
    storagePct >= 85 ? COLORS.used.bad :
    storagePct >= 60 ? COLORS.used.warn :
    COLORS.used.good

  const storageChart = [
    { name: "Used", value: storagePct },
    { name: "Free", value: 100 - storagePct },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-28 bg-white rounded-xl shadow" />
              <div className="h-28 bg-white rounded-xl shadow" />
              <div className="h-28 bg-white rounded-xl shadow" />
            </div>
            <div className="h-80 bg-white rounded-xl shadow" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Active Devices" value={data?.numberOfActiveDevices ?? 0} />
          <StatCard label="Locations" value={data?.numberOfLocations ?? 0} />
          <StatCard label="Storage Usage" value={`${storagePct.toFixed(0)}%`} />
        </div>

        {/* Storage donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Storage</h2>
            <div className="h-72">
              <ResponsiveContainer>
                {/* Non-interactive: no tooltip/hover/click, no focus */}
                <PieChart style={{ pointerEvents: "none" }} tabIndex={-1}>
                  <Pie
                    data={storageChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {/* Used slice */}
                    <Cell fill={usedColor} />
                    {/* Free slice */}
                    <Cell fill={COLORS.free} />
                    {/* Center label */}
                    <Label
                      value={`${Math.round(storagePct)}%`}
                      position="center"
                      fontSize={22}
                      fontWeight={700}
                      fill="#111827" // gray-900
                    />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {storagePct.toFixed(0)}% used • {(100 - storagePct).toFixed(0)}% free
            </p>
          </div>

          {/* Campaigns */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2">
              Running campaigns {Array.isArray(data?.campaigns) ? `(${data.campaigns.length})` : ""}
            </h2>

            {Array.isArray(data?.campaigns) && data.campaigns.length > 0 ? (
              <ul className="divide-y max-h-72 overflow-auto">
                {data.campaigns.map((c) => {
                  const id = c.campaignId
                  const title = c.campaignName
                  if (id == null) return null
                  return (
                    <li key={id}>
                      <button
                        onClick={() => goToCampaign(id)}
                        className="w-full cursor-pointer text-left flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50"
                      >
                        <span className="font-medium truncate">{title}</span>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">No campaigns.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, subText }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {subText && <div className="text-xs text-gray-500 mt-1">{subText}</div>}
    </div>
  )
}
