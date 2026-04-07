import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import DashboardStats from './DashboardStats';
import DashboardSalesChart from './DashboardSalesChart';
import DashboardTopProducts from './DashboardTopProducts';
import SalesRepDashboard from './SalesRepDashboard';
import { getDashboardStats } from '../../api/dashboardService';
import { getUserName, getUserRole } from '../common/Utils/userUtils/userUtils';
import { isSalesRep } from '../../auth/roleService';
import { RefreshCw } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState('');
    const [loggedInUserRole, setLoggedInUserRole] = useState('');
    const [isSalesRepUser, setIsSalesRepUser] = useState(false);

    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchUserInfo = async () => {
        const name = await getUserName();
        const role = await getUserRole();
        setLoggedInUser(name);
        setLoggedInUserRole(role);
    };

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getDashboardStats();
            setDashData(res.data);
            setLastRefreshed(new Date());
        } catch (e) {
            console.error('Failed to load dashboard data', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserInfo();
        setIsSalesRepUser(isSalesRep());
        fetchDashboardData();
    }, [fetchDashboardData]);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

    return (
        <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
                isMobileOpen={isMobileSidebarOpen}
                toggleMobileSidebar={toggleMobileSidebar}
            />
            {isSalesRepUser || loggedInUserRole === 'SALES_REP' || loggedInUserRole === 'Sales Rep' ? (
                <SalesRepDashboard userName={loggedInUser} />
            ) : (
                <div className="dashboard-content">
                    {/* ── Header ── */}
                    <header className="dashboard-header">
                        <div>
                            <h2>Welcome back, {loggedInUser || 'Manager'} 👋</h2>
                            <p className="dashboard-subhead">
                                {lastRefreshed
                                    ? `Last updated: ${lastRefreshed.toLocaleTimeString()}`
                                    : 'Loading data…'}
                            </p>
                        </div>
                        <button
                            className="action-btn db-refresh-btn"
                            onClick={fetchDashboardData}
                            disabled={loading}
                            title="Refresh dashboard"
                        >
                            <RefreshCw size={15} className={loading ? 'db-spin' : ''} />
                            Refresh
                        </button>
                    </header>

                    {/* ── KPI Cards ── */}
                    <section className="dashboard-stats-section">
                        <DashboardStats data={dashData} loading={loading} />
                    </section>

                    {/* ── Sales Trend ── */}
                    <section className="dashboard-chart-section">
                        <DashboardSalesChart
                            trend={dashData?.salesTrend ?? []}
                            loading={loading}
                        />
                    </section>

                    {/* ── Charts & Alert tables ── */}
                    <section className="dashboard-products-section">
                        <DashboardTopProducts data={dashData} loading={loading} />
                    </section>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
