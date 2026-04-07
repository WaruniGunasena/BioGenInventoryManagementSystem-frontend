import React from "react";
import {
    ShoppingCart,
    AlertTriangle,
    Clock,
    Wallet,
} from "lucide-react";

const KPI_CONFIG = [
    {
        key: "pendingOrdersCount",
        label: "Pending Orders",
        icon: ShoppingCart,
        color: "#6366f1",
        bg: "#eef2ff",
        format: (v) => v ?? "—",
    },
    {
        key: "totalOutstandingBalance",
        label: "Total Outstanding",
        icon: Wallet,
        color: "#f59e0b",
        bg: "#fffbeb",
        format: (v) =>
            v != null
                ? `LKR ${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : "—",
    },
    {
        key: "lowStockCount",
        label: "Low Stock Items",
        icon: AlertTriangle,
        color: "#ef4444",
        bg: "#fff1f2",
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
