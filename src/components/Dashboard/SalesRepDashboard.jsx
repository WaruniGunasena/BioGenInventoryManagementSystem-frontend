import React from 'react';
import SalesRepStats from './SalesRepStats';
import SalesRepHistoryChart from './SalesRepHistoryChart';
import { RefreshCw } from 'lucide-react';
import './Dashboard.css';

const SalesRepDashboard = ({ userName, data, loading, onRefresh }) => {
    return (
        <div className="dashboard-content" style={{ width: '100%' }}>
            <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Welcome back, {userName || "Sales Rep"}! 👋</h2>
                    <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>Here is your sales overview and performance history.</p>
                </div>
                <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        className="action-btn db-refresh-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh dashboard"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={15} className={loading ? 'db-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </header>

            <section className="dashboard-stats-section" style={{ marginBottom: '24px' }}>
                <SalesRepStats data={data} loading={loading} />
            </section>

            <section className="dashboard-chart-section" style={{ marginBottom: '24px' }}>
                <SalesRepHistoryChart trend={data?.mySalesPerformanceHistory ?? []} loading={loading} />
            </section>
        </div>
    );
};

export default SalesRepDashboard;
