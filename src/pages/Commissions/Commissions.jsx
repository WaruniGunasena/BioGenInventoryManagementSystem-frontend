import React, { useState, useEffect } from 'react';
import DataTable from '../../components/common/DataTable';
import MetricCard from '../../components/common/MetricCard';
import Sidebar from '../../components/Sidebar';
import Layout from '../../components/Layout';
import { getCommissions, getMyCommissions } from '../../api/commissionService';
import '../../components/Dashboard/Dashboard.css';
import './Commissions.css';

const Commissions = ({ role = 'salesRep' }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [commissions, setCommissions] = useState([]);
    const [totalCommission, setTotalCommission] = useState(0);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCommissions = async () => {
            setIsLoading(true);
            try {
                const response = role === 'salesRep' ? await getMyCommissions() : await getCommissions();
                
                const responseData = response.data;
                const data = Array.isArray(responseData) ? responseData : (responseData?.data || []);
                setCommissions(data);
                
                // Calculate total commission
                const total = data.reduce((acc, curr) => acc + (curr.totalCommission || 0), 0);
                setTotalCommission(total);
            } catch (error) {
                console.error("Failed to fetch commissions:", error);
                // Fallback to empty state on error
                setCommissions([]);
                setTotalCommission(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommissions();
    }, [role]);

    const columns = [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer", accessor: "customer" },
        { header: "Date", accessor: "date" },
        { 
            header: "Commissionable Amount", 
            accessor: "commissionableAmount",
            render: (row) => `Rs. ${(row.commissionableAmount || 0).toFixed(2)}`,
            align: 'right'
        },
        { 
            header: "Total Commission", 
            accessor: "totalCommission",
            render: (row) => `Rs. ${(row.totalCommission || 0).toFixed(2)}`,
            align: 'right'
        }
    ];

    const todayDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');

    return (
        <Layout>
            <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />
                <div className="dashboard-content commissions-page">
                    <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>{role === 'salesRep' ? 'My Commissions' : 'Commission Management'}</h2>
                    </header>
                    
                    {isLoading && <div className="loading-overlay">Loading...</div>}

                    <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                        <MetricCard
                            title="Total commission (current)"
                            value={`Rs. ${totalCommission.toFixed(2)}`}
                            isPrimary={true}
                            trend={{ 
                                value: `Date ${todayDate}`, 
                                isPositive: true,
                                label: ' ' // Empty label as requested by draft
                            }}
                        />
                    </div>

                    <div className="table-container-section">
                        <h3 className="section-title">Commissionable invoices</h3>
                        <DataTable
                            columns={columns}
                            data={commissions}
                            showActions={false}
                            showAddButton={false}
                            showSearch={true}
                            showFilter={false}
                            showExport={true}
                            onExportCSV={() => console.log('Export CSV')}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Commissions;
