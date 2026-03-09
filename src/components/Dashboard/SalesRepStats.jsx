import React from 'react';

const SalesRepStats = () => {
    const stats = [
        {
            title: "My Monthly Sales",
            value: "LKR 2.5 M",
            change: "+ 15%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#60a5fa", // blue-400
            iconColor: "#3b82f6" // blue-500
        },
        {
            title: "Today's Orders",
            value: "14 Orders",
            change: "+ 3",
            subtitle: "vs yesterday",
            isPositive: true,
            color: "#4ade80", // green-400
            iconColor: "#22c55e" // green-500
        },
        {
            title: "Target Achieved",
            value: "85%",
            change: "+ 5%",
            subtitle: "vs last month",
            isPositive: true,
            color: "#f472b6", // pink-400
            iconColor: "#ec4899" // pink-500
        },
        {
            title: "Active Customers",
            value: "120",
            change: "+ 12",
            subtitle: "new this month",
            isPositive: true,
            color: "#fbbf24", // amber-400
            iconColor: "#f59e0b" // amber-500
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

export default SalesRepStats;
