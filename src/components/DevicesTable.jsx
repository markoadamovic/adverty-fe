import React from "react"
import { formatHeartbeat } from "../utils/formatters.js"

export default function DevicesTable({
  devices,
  loading,
  error,
  onRetry,          // () => void
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      {loading && <div className="p-4 text-sm text-gray-600">Loading devices…</div>}
      {error && (
        <div className="p-4 text-sm text-red-600 break-words">
          {error}
          <div className="mt-2">
            <button onClick={onRetry} className="text-sm underline">Retry</button>
          </div>
        </div>
      )}
      {!loading && !error && (
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">Name</th>
              <th className="py-2 px-4 border text-center">Active</th>
              <th className="py-2 px-4 border text-left">Heartbeat</th>
              <th className="py-2 px-4 border text-left">Campaign</th>
              <th className="py-2 px-4 border text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="py-2 px-4">{d.name}</td>
                <td className="py-2 px-4 text-center">{d.active ? "✅" : "❌"}</td>
                <td className="py-2 px-4">{formatHeartbeat(d.heartbeat)}</td>
                <td className="py-2 px-4 text-left">{d.campaignName || "-"}</td>
                <td className="py-2 px-4">{d.locationName || "-"}</td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td className="py-6 text-center text-gray-500" colSpan={5}>
                  No devices match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
