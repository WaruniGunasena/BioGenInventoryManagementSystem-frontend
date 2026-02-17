import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import DashboardStats from './DashboardStats';
import DashboardSalesChart from './DashboardSalesChart';
import DashboardTopProducts from './DashboardTopProducts';
import './Dashboard.css';

const Dashboard = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <h2>Welcome back, Waruni</h2>
                    <div className="header-actions">
                        <button className="action-btn">All Locations</button>
                        <button className="action-btn">Today - last 30 days</button>
                        <button className="action-btn filter-btn">Filters</button>
                    </div>
                </header>

                <section className="dashboard-stats-section">
                    <DashboardStats />
                </section>

                <section className="dashboard-chart-section">
                    <DashboardSalesChart />
                </section>

                <section className="dashboard-products-section">
                    <DashboardTopProducts />
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
