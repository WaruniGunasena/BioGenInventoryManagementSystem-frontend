import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from "recharts";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const PIE_COLORS = {
    "Healthy":      "#10b981",
    "Low Stock":    "#f59e0b",
    "Out of Stock": "#ef4444",
};

/* ── Top selling products bar chart ── */
const TopSellingChart = ({ products = [], loading }) => {
    const data = products.map((p) => ({
        name: p.productName ?? p.name ?? "Unknown",
        qty: parseFloat(p.totalQty ?? 0),
        revenue: parseFloat(p.totalRevenue ?? p.revenue ?? 0),
    }));

    return (
        <div className="card most-sold-products">
            <div className="card-header">
                <h3>Top 5 Selling Products</h3>
                <span className="db-badge db-badge-indigo">By Volume</span>
            </div>
            {loading ? (
                <div className="db-chart-skeleton" />
            ) : data.length === 0 ? (
                <p className="db-empty">No data available.</p>
            ) : (
                <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={130}
                            tick={{ fontSize: 12, fill: "#374151" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(val) => [`${val} units`, "Qty Sold"]}
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        />
                        <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={18}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

/* ── Stock status donut chart ── */
const StockStatusChart = ({ distribution = {}, loading }) => {
    const data = Object.entries(distribution).map(([name, value]) => ({
        name,
        value: Number(value),
    }));

    const total = data.reduce((s, d) => s + d.value, 0);

    return (
        <div className="card top-moving-category">
            <div className="card-header">
                <h3>Stock Status</h3>
                <span className="db-badge db-badge-green">{total} products</span>
            </div>
            {loading ? (
                <div className="db-chart-skeleton" />
            ) : data.length === 0 ? (
                <p className="db-empty">No stock data.</p>
            ) : (
                <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={PIE_COLORS[entry.name] ?? BAR_COLORS[i]}
                                />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} products`, n]} />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

/* ── Alert tables: low stock & expiry ── */
const AlertTable = ({ title, rows = [], columns, badge, badgeColor, loading }) => (
    <div className="card db-alert-card">
        <div className="card-header">
            <h3>{title}</h3>
            <span className={`db-badge db-badge-${badgeColor}`}>{badge}</span>
        </div>
        {loading ? (
            <div className="db-chart-skeleton" />
        ) : rows.length === 0 ? (
            <p className="db-empty">All clear — no alerts.</p>
        ) : (
            <div className="db-table-wrap">
                <table className="db-table">
                    <thead>
                        <tr>
                            {columns.map((c) => (
                                <th key={c.key}>{c.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, 8).map((row, i) => (
                            <tr key={i}>
                                {columns.map((c) => (
                                    <td key={c.key}>{row[c.key] ?? "—"}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

/* ── Combined bottom section ── */
const DashboardTopProducts = ({ data, loading }) => {
    const LOW_STOCK_COLS = [
        { key: "name",         label: "Product" },
        { key: "currentStock", label: "Stock" },
        { key: "limit", label: "Min Level" },
    ];
    const EXPIRY_COLS = [
        { key: "productName", label: "Product" },
        { key: "batchNumber", label: "Batch" },
        { key: "expiry",      label: "Expiry" },
        { key: "quantity",    label: "Qty" },
    ];

    return (
        <>
            {/* Row 1: charts side by side */}
            <div className="dashboard-bottom-section">
                <TopSellingChart
                    products={data?.topSellingProducts ?? []}
                    loading={loading}
                />
                <StockStatusChart
                    distribution={data?.stockStatusDistribution ?? {}}
                    loading={loading}
                />
            </div>

            {/* Row 2: alert tables */}
            <div className="dashboard-bottom-section" style={{ marginTop: 24 }}>
                <AlertTable
                    title="Low Stock Alerts"
                    rows={data?.lowStockList ?? []}
                    columns={LOW_STOCK_COLS}
                    badge={`${data?.lowStockCount ?? 0} items`}
                    badgeColor="red"
                    loading={loading}
                />
                <AlertTable
                    title="Expiring Soon (next 3 months)"
                    rows={data?.expiryList ?? []}
                    columns={EXPIRY_COLS}
                    badge={`${data?.upcomingExpiriesCount ?? 0} items`}
                    badgeColor="amber"
                    loading={loading}
                />
            </div>
        </>
    );
};

export default DashboardTopProducts;
