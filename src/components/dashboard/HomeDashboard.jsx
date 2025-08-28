import { useNavigate } from "react-router-dom";
import StatCard from "./StatCard";
import CampaignList from "./CampaignList";
import StorageDonut from "./StorageDonut";
import { normalizePercent } from "../../utils/formatters";
import { useDashboard } from "../../services/dashboardApi";

export default function HomeDashboard() {
  const { data, loading, error, unauthenticated } = useDashboard();
  const navigate = useNavigate();

  if (unauthenticated) {
    navigate("/login", { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-28 bg-white rounded-2xl shadow" />
              <div className="h-28 bg-white rounded-2xl shadow" />
              <div className="h-28 bg-white rounded-2xl shadow" />
            </div>
            <div className="h-80 bg-white rounded-2xl shadow" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const pct = normalizePercent(data?.storageUsage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Active Devices" value={data?.numberOfActiveDevices ?? 0} />
          <StatCard label="Locations" value={data?.numberOfLocations ?? 0} />
          <StatCard label="Storage Usage" value={`${pct.toFixed(0)}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Storage</h2>
            <StorageDonut percentUsed={pct} />
            <p className="text-sm text-gray-600 mt-2">
              {pct.toFixed(0)}% used • {(100 - pct).toFixed(0)}% free
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2">
              Running campaigns {Array.isArray(data?.campaigns) ? `(${data.campaigns.length})` : ""}
            </h2>
            <CampaignList campaigns={data?.campaigns} />
          </div>
        </div>
      </div>
    </div>
  );
}

