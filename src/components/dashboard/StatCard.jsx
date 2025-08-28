export default function StatCard({ label, value, subText }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {subText && <div className="text-xs text-gray-500 mt-1">{subText}</div>}
    </div>
  );
}
