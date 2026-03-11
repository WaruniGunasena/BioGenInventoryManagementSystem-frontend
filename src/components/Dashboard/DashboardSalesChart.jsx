import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', Sales: 4000, Inventory: 2400 },
    { name: 'Feb', Sales: 3000, Inventory: 1398 },
    { name: 'Mar', Sales: 2000, Inventory: 9800 },
    { name: 'Apr', Sales: 2780, Inventory: 3908 },
    { name: 'May', Sales: 1890, Inventory: 4800 },
    { name: 'Jun', Sales: 2390, Inventory: 3800 },
    { name: 'Jul', Sales: 3490, Inventory: 4300 },
    { name: 'Aug', Sales: 4000, Inventory: 2400 },
    { name: 'Sep', Sales: 3000, Inventory: 1398 },
    { name: 'Oct', Sales: 2000, Inventory: 9800 },
    { name: 'Nov', Sales: 2780, Inventory: 3908 },
    { name: 'Dec', Sales: 1890, Inventory: 4800 },
];

const DashboardSalesChart = () => {
    return (
        <div className="dashboard-chart-container">
            <div className="chart-header">
                <h3>Monthly Sales Vs Inventory Analysis</h3>
                <span className="expand-icon">^</span>
            </div>
            <div className="chart-body">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Legend iconType="circle" wrapperStyle={{ top: -10, right: 0 }} />
                        <Bar dataKey="Sales" name="Sales Revenue" stackId="a" fill="#60a5fa" barSize={15} />
                        <Bar dataKey="Inventory" name="Inventory Issued" stackId="a" fill="#ef4444" barSize={15} />
                        <Bar dataKey="Sales" name="Bonus Stock" stackId="a" fill="#f59e0b" barSize={15} /> {/* Reusing data for demo */}
                    </BarChart>
                </ResponsiveContainer>
                <div className="chart-footer-years">
                    <span className="arrow-left">{'<'}</span>
                    <span className="year-label">2023</span>
                    <span className="year-label">2024</span>
                    <span className="arrow-right">{'>'}</span>

                </div>
            </div>
        </div>
    );
};

export default DashboardSalesChart;
