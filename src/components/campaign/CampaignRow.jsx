import ActionButton from "../ActionButton.jsx"
import { canDeploy, canPlay, canStop, canDelete } from "../../utils/CampaignActions.js"

export default function CampaignRow({
  campaign,
  onRowClick,
  onDeploy,
  onPlay,
  onStop,
  onDelete,
}) {
  const c = campaign
  const stopRow = (e) => { e.stopPropagation(); e.preventDefault() }

  return (
    <tr
      className="border-t hover:bg-gray-50 cursor-pointer"
      onClick={() => onRowClick(c)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onRowClick(c)}
    >
      <td className="py-2 px-4 text-left">{c.name}</td>
      <td className="py-2 px-4 text-left">
        <span className="inline-block px-2 py-1 rounded-md text-xs font-medium">
          {c.campaignStatus}
        </span>
      </td>
      <td className="py-2 px-4 text-left">
        {typeof c.numberOfDevices === "number" ? c.numberOfDevices : 0}
      </td>

      {/* Actions */}
      <td className="py-2 px-4 text-left">
        <div className="flex items-center gap-2">
          {canDelete(c) && (
            <ActionButton
              label="Delete"
              title="Delete campaign"
              variant="danger"
              onClick={(e) => { stopRow(e); onDelete(c) }}
            />
          )}
          {canDeploy(c) && (
            <ActionButton
              label="Deploy"
              title="Deploy campaign"
              variant="default"
              onClick={(e) => { stopRow(e); onDeploy(c) }}
            />
          )}
          {canPlay(c) && (
            <ActionButton
              label="Play"
              title="Start playback"
              variant="success"
              onClick={(e) => { stopRow(e); onPlay(c) }}
            />
          )}
          {canStop(c) && (
            <ActionButton
              label="Stop"
              title="Stop playback"
              variant="warn"
              onClick={(e) => { stopRow(e); onStop(c) }}
            />
          )}
        </div>
      </td>
    </tr>
  )
}
