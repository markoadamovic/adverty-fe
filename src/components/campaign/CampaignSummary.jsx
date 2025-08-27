export default function CampaignSummary({ data }) {
  if (!data) return null

  return (
    <div className="bg-white rounded-xl border p-4 w-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-gray-500 text-sm">Name</div>
          <div className="font-medium">{data.name}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Status</div>
          <span className="inline-block px-2 py-1 rounded-md text-xs font-medium">
            {data.campaignStatus}
          </span>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Default</div>
          <div className="font-medium">{data.isDefault ? "Yes" : "No"}</div>
        </div>
        <div>
          <div className="text-gray-500 text-sm">Image duration (s)</div>
          <div className="font-medium">{data.imageDuration ?? "-"}</div>
        </div>
      </div>
    </div>
  )
}
