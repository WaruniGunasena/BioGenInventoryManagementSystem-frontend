import React from "react";
import {
    ShoppingCart,
    AlertTriangle,
    Clock,
    Wallet,
    TrendingUp,
    CalendarDays,
} from "lucide-react";

const fmt = (v) =>
    v != null
        ? `LKR ${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : "—";

const KPI_CONFIG = [
    // ── Row 1 ────────────────────────────────────────────────────────
    {
        key: "todaySales",
        label: "Today's Sales",
        icon: TrendingUp,
        color: "#6366f1",
        bg: "#eef2ff",
        format: fmt,
    },
    {
        key: "monthlySales",
        label: "Monthly Sales",
        icon: CalendarDays,
        color: "#8b5cf6",
        bg: "#f5f3ff",
        format: fmt,
    },
    {
        key: "pendingOrdersCount",
        label: "Pending Orders",
        icon: ShoppingCart,
        color: "#f59e0b",
        bg: "#fffbeb",
        format: (v) => v ?? "—",
    },
    // ── Row 2 ────────────────────────────────────────────────────────
    {
        key: "totalOutstandingBalance",
        label: "Total Outstanding",
        icon: Wallet,
        color: "#ef4444",
        bg: "#fff1f2",
        format: fmt,
    },
    {
        key: "lowStockCount",
        label: "Low Stock Items",
        icon: AlertTriangle,
        color: "#f97316",
        bg: "#fff7ed",
        format: (v) => (v != null ? `${v} items` : "—"),
    },
    {
        key: "upcomingExpiriesCount",
        label: "Expiring Soon (3 mo.)",
        icon: Clock,
        color: "#10b981",
        bg: "#f0fdf4",
        format: (v) => (v != null ? `${v} items` : "—"),
    },
];

const DashboardStats = ({ data, loading }) => {
    return (
        <div className="dashboard-stats-grid">
            {KPI_CONFIG.map(({ key, label, icon: Icon, color, bg, format }) => (
                <div key={key} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
                    <div className="stat-header">
                        <h3>{label}</h3>
                        <div className="stat-icon-wrap" style={{ background: bg }}>
                            <Icon size={18} color={color} />
                        </div>
                    </div>
                    <div className="stat-value" style={{ color }}>
                        {loading ? <span className="stat-skeleton" /> : format(data?.[key])}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
