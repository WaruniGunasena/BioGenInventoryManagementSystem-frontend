import React from 'react';

const DashboardStats = () => {
    const stats = [
        {
            title: "Total Medicine in Stock",
            value: "3000 Units",
            change: "+ 12%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#4ade80", // green-400
            iconColor: "#22c55e" // green-500
        },
        {
            title: "Low Stock Alerts",
            value: "38 Items",
            change: "- 2%",
            subtitle: "vs last month",
            isPositive: false,
            color: "#fbbf24", // amber-400
            iconColor: "#f59e0b" // amber-500
        },
        {
            title: "Expired / Near Expiry",
            value: "12 Items",
            change: "+ 2%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#f87171", // red-400
            iconColor: "#ef4444" // red-500
        },
        {
            title: "Today's Sales",
            value: "LKR 100 000",
            change: "+ 12%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#60a5fa", // blue-400
            iconColor: "#3b82f6" // blue-500
        },
        {
            title: "Monthly Sales Revenue",
            value: "LKR 10 M",
            change: "+ 12%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#60a5fa", // blue-400
            iconColor: "#3b82f6" // blue-500
        },
        {
            title: "Debt Payment",
            value: "LKR 2 M",
            change: "+ 2%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#60a5fa", // blue-400
            iconColor: "#3b82f6" // blue-500
        }
    ];

    return (
        <div className="dashboard-stats-grid">
            {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                    <div className="stat-header">
                        <h3>{stat.title}</h3>
                        <span className="more-options">⋮</span>
                    </div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-change">
                        <span className={`change-indicator ${stat.isPositive ? 'positive' : 'negative'}`}>
                            {stat.change}
                        </span>
                        <span className="subtitle"> {stat.subtitle}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
