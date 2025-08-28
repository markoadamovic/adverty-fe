import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Label,
} from "recharts";

// Free is always good (green). Used: gray → amber → red.
const COLORS = {
  used: { good: "#22c55e", warn: "#f59e0b", bad: "#ef4444" }, // green/amber/red
  free: "#e5e7eb", // gray-200
}

export default function StorageDonut({ percentUsed }) {
  const used =
    percentUsed >= 85 ? COLORS.used.bad :
    percentUsed >= 60 ? COLORS.used.warn :
    COLORS.used.good;

  const data = [
    { name: "Used", value: percentUsed },
    { name: "Free", value: 100 - percentUsed },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer>
        {/* Non-interactive: no hover/click/focus */}
        <PieChart style={{ pointerEvents: "none" }} tabIndex={-1}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="transparent"
          >
            <Cell fill={used} />
            <Cell fill={COLORS.free} />
            <Label
              value={`${Math.round(percentUsed)}%`}
              position="center"
              fontSize={22}
              fontWeight={700}
              fill={used}
            />
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
