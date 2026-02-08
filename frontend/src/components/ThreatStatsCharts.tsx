import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import type { ThreatStats } from "@/lib/api";

interface ThreatStatsChartsProps {
    stats: ThreatStats;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function ThreatStatsCharts({ stats }: ThreatStatsChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart - Top Countries */}
            <div className="bg-panel/50 border border-border/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Top Countries
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.by_country} layout="vertical">
                        <XAxis type="number" stroke="#64748b" fontSize={10} />
                        <YAxis
                            type="category"
                            dataKey="country"
                            stroke="#64748b"
                            fontSize={10}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                            }}
                        />
                        <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Chart - Threat Types */}
            <div className="bg-panel/50 border border-border/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                    Threat Types
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={stats.by_type}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ type, percent }) =>
                                `${type} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={false}
                        >
                            {stats.by_type.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: "12px" }}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
