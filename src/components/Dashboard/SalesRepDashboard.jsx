import React from 'react';
import SalesRepStats from './SalesRepStats';
import SalesRepHistoryChart from './SalesRepHistoryChart';
import './Dashboard.css';

const SalesRepDashboard = ({ userName }) => {
    return (
        <div className="dashboard-content" style={{ width: '100%' }}>
            <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Welcome back, {userName || "Sales Rep"}! 👋</h2>
                    <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>Here is your sales overview and performance history.</p>
                </div>
                <div className="header-actions">
                    <button className="action-btn">This Month</button>
                    <button className="action-btn filter-btn" style={{ background: '#3b82f6', color: 'white', border: 'none' }}>Export Report</button>
                </div>
            </header>

            <section className="dashboard-stats-section" style={{ marginBottom: '24px' }}>
                <SalesRepStats />
            </section>

            <section className="dashboard-chart-section" style={{ marginBottom: '24px' }}>
                <SalesRepHistoryChart />
            </section>
        </div>
    );
};

export default SalesRepDashboard;
