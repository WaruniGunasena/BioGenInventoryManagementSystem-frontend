import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SalesRepHistoryChart = ({ trend = [], loading }) => {
    const chartData = trend.map((row) => ({
        name: row.name ?? '—',
        Sales: parseFloat(row.Sales ?? 0),
    }));

    const tickFormatter = (value) => {
        if (value >= 1000000) return `LKR ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `LKR ${(value / 1000).toFixed(0)}k`;
        return `LKR ${value}`;
    };

    return (
        <div className="dashboard-chart-container" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div className="chart-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>My Sales Performance (Last 12 Months)</h3>
                    <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '13px' }}>Based on approved invoices</p>
                </div>
                <span className="expand-icon" style={{ cursor: 'pointer', color: '#6b7280' }}>^</span>
            </div>
            
            {loading ? (
                <div className="db-chart-skeleton" style={{ height: '350px' }} />
            ) : chartData.length === 0 ? (
                <p className="db-empty" style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>No sales data available for the last 12 months.</p>
            ) : (
                <div className="chart-body">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={tickFormatter} dx={-10} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Sales']}
                            />
                            <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default SalesRepHistoryChart;
