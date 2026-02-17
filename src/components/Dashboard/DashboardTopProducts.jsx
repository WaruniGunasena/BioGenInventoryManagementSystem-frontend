import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Purchased', value: 300, color: '#3b82f6' }, // blue
    { name: 'Remaining', value: 700, color: '#e5e7eb' }, // gray
];


const donutData = [
    { name: 'Group A', value: 400, color: '#ef4444' }, // red
    { name: 'Group B', value: 300, color: '#3b82f6' }, // blue
    { name: 'Group C', value: 300, color: '#22c55e' }, // green
    { name: 'Group D', value: 200, color: '#f59e0b' }, // yellow
];

const products = [
    { name: "Paracetamol", percentage: 37, color: "#8b5cf6" },
    { name: "Amoxicillin 250mg", percentage: 14, color: "#8b5cf6" },
    { name: "Ibuprofen", percentage: 50, color: "#8b5cf6" },
    { name: "Cetirizine 10mg", percentage: 50, color: "#8b5cf6" },
    { name: "Metformin", percentage: 50, color: "#8b5cf6" },
    { name: "Atorvastatin", percentage: 50, color: "#8b5cf6" },
    { name: "Omeprazole", percentage: 50, color: "#8b5cf6" },
    { name: "Inhaler", percentage: 50, color: "#8b5cf6" },
];


const DashboardTopProducts = () => {
    return (
        <div className="dashboard-bottom-section">
            <div className="card top-moving-category">
                <div className="card-header">
                    <h3>Top Moving Category</h3>
                    <select className="filter-select">
                        <option>By Volume</option>
                    </select>
                </div>
                <div className="donut-chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                            >
                                {donutData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                        <div className="donut-label">
                            <span>Purchased</span>
                            <strong>30%</strong>
                        </div>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card most-sold-products">
                <div className="card-header">
                    <h3>Most Sold Products</h3>
                    <select className="filter-select">
                        <option>By Volume</option>
                    </select>
                </div>
                <ul className="product-list">
                    {products.map((product, index) => (
                        <li key={index} className="product-item">
                            <span className="product-name">{product.name}</span>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${product.percentage}%`, backgroundColor: product.color }}
                                ></div>
                            </div>
                            <span className="product-percentage">{product.percentage}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DashboardTopProducts;
