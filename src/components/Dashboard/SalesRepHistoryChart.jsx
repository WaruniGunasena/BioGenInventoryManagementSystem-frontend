import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', Sales: 1200000 },
    { name: 'Feb', Sales: 1500000 },
    { name: 'Mar', Sales: 1100000 },
    { name: 'Apr', Sales: 1800000 },
    { name: 'May', Sales: 2200000 },
    { name: 'Jun', Sales: 1900000 },
    { name: 'Jul', Sales: 2500000 },
    { name: 'Aug', Sales: 2400000 },
    { name: 'Sep', Sales: 2600000 },
    { name: 'Oct', Sales: 2800000 },
    { name: 'Nov', Sales: 2300000 },
    { name: 'Dec', Sales: 3100000 },
];

const SalesRepHistoryChart = () => {
    return (
        <div className="dashboard-chart-container" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div className="chart-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>My Sales Performance (Last 12 Months)</h3>
                <span className="expand-icon" style={{ cursor: 'pointer', color: '#6b7280' }}>^</span>
            </div>
            <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart
                        data={data}
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
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `LKR ${value / 1000000}M`} dx={-10} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Sales']}
                        />
                        <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SalesRepHistoryChart;
