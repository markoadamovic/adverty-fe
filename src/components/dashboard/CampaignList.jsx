import { Link } from "react-router-dom";

export default function CampaignList({ campaigns = [] }) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return <div className="text-sm text-gray-600">No campaigns.</div>;
  }

  return (
    <ul className="divide-y max-h-72 overflow-auto">
      {campaigns.map((c) => {
        const id = c.campaignId;
        const title = c.campaignName || `Campaign ${id}`;
        if (id == null) return null;
        return (
          <li key={id}>
            <Link
              to={`/dashboard/campaigns/${encodeURIComponent(id)}`}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <span className="font-medium truncate">{title}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
