import React from 'react';
import { TrendingUp, ShoppingCart, Users } from 'lucide-react';

const formatCurrency = (val) => {
    if (val === undefined || val === null) return "LKR 0.00";
    const num = parseFloat(val);
    if (num >= 1000000) {
        return `LKR ${(num / 1000000).toFixed(1)} M`;
    }
    return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SalesRepStats = ({ data, loading }) => {
    const stats = [
        {
            title: "My Monthly Sales",
            value: formatCurrency(data?.myMonthlySales),
            change: data?.myMonthlySalesChange !== undefined 
                ? `${data.myMonthlySalesChange >= 0 ? '+' : ''}${data.myMonthlySalesChange.toFixed(0)}%` 
                : "0%",
            subtitle: "vs last month",
            isPositive: data?.myMonthlySalesChange === undefined || data.myMonthlySalesChange >= 0,
            icon: TrendingUp,
            color: "#6366f1",
            bg: "#eef2ff"
        },
        {
            title: "Today's Orders",
            value: `${data?.myTodayOrdersCount ?? 0} Orders`,
            change: data?.myTodayOrdersChange !== undefined 
                ? `${data.myTodayOrdersChange >= 0 ? '+' : ''}${data.myTodayOrdersChange}` 
                : "+0",
            subtitle: "vs yesterday",
            isPositive: data?.myTodayOrdersChange === undefined || data.myTodayOrdersChange >= 0,
            icon: ShoppingCart,
            color: "#10b981",
            bg: "#f0fdf4"
        },
        {
            title: "Active Customers",
            value: `${data?.myActiveCustomersCount ?? 0}`,
            change: data?.myActiveCustomersChange !== undefined 
                ? `${data.myActiveCustomersChange >= 0 ? '+' : ''}${data.myActiveCustomersChange}` 
                : "+0",
            subtitle: "new this month",
            isPositive: data?.myActiveCustomersChange === undefined || data.myActiveCustomersChange >= 0,
            icon: Users,
            color: "#0ea5e9",
            bg: "#f0f9ff"
        }
    ];

    return (
        <div className="dashboard-stats-grid">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="stat-card" style={{ borderTop: `3px solid ${stat.color}` }}>
                        <div className="stat-header">
                            <h3>{stat.title}</h3>
                            <div className="stat-icon-wrap" style={{ background: stat.bg }}>
                                <Icon size={18} color={stat.color} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: stat.color }}>
                            {loading ? <span className="stat-skeleton" /> : stat.value}
                        </div>
                        <div className="stat-change">
                            {loading ? (
                                <span className="stat-skeleton" style={{ width: '60px', height: '14px', marginTop: '4px' }} />
                            ) : (
                                <>
                                    <span className={`change-indicator ${stat.isPositive ? 'positive' : 'negative'}`}>
                                        {stat.change}
                                    </span>
                                    <span className="subtitle"> {stat.subtitle}</span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SalesRepStats;
