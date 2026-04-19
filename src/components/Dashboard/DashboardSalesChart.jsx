import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="db-tooltip">
                <p className="db-tooltip-label">{label}</p>
                <p className="db-tooltip-value">
                    LKR{" "}
                    {parseFloat(payload[0].value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                    })}
                </p>
            </div>
        );
    }
    return null;
};

const DashboardSalesChart = ({ trend = [], loading }) => {
    // Backend returns [{saleDate, totalSales}] — normalise for recharts
    const chartData = trend.map((row) => ({
        date: row.date
            ? new Date(row.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
              })
            : "—",
        revenue: parseFloat(row.total ?? 0),
    }));

    return (
        <div className="dashboard-chart-container">
            <div className="chart-header">
                <div>
                    <h3>30-Day Sales Trend</h3>
                    <p className="chart-sub">Based on approved invoices</p>
                </div>
            </div>

            {loading ? (
                <div className="db-chart-skeleton" />
            ) : chartData.length === 0 ? (
                <p className="db-empty">No sales data for the last 30 days.</p>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            tickFormatter={(v) =>
                                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                            }
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fill="url(#salesGrad)"
                            dot={false}
                            activeDot={{ r: 5, fill: "#6366f1" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default DashboardSalesChart;
