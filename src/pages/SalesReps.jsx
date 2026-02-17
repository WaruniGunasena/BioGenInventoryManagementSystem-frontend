import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import '../components/Dashboard/Dashboard.css';

const SalesReps = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Metrics
    const metrics = [
        { title: "Active Sales Reps", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Inactive Sales Reps", value: 19, trend: { value: "12%", isPositive: true }, isPrimary: false },
        { title: "Deleted Sales Reps", value: 10, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        {
            header: "Sales Rep Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" />
                    <span>{row.name}</span>
                </div>
            )
        },
        { header: "Sales Rep ID", accessor: "salesRepId" },
        { header: "Department ID", accessor: "departmentId" },
        { header: "Warehouse ID", accessor: "warehouseId" },
        {
            header: "Hire Date", accessor: "hireDate", render: (row) => (
                <div>
                    <div>{row.hireDate}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{row.hireTime}</div>
                </div>
            )
        },
        { header: "Phone Number", accessor: "phone" },
    ];

    const data = [
        { id: 1, name: "Haritha Jayendra", salesRepId: "BC2022110001", departmentId: "BC2022110001", warehouseId: "BC2022110001", hireDate: "Jan 4, 2022", hireTime: "11:30 AM", phone: "+1 8639724863", isActive: true },
        { id: 2, name: "Nipuni Malka", salesRepId: "BC2022110002", departmentId: "BC2022110001", warehouseId: "BC2022110001", hireDate: "Jan 4, 2022", hireTime: "11:30 AM", phone: "+1 8639724863", isActive: true },
        { id: 3, name: "Rumesha Gunasena", salesRepId: "BC2022110003", departmentId: "BC2022110001", warehouseId: "BC2022110001", hireDate: "Jan 4, 2022", hireTime: "11:30 AM", phone: "+1 8639724863", isActive: true },
        { id: 4, name: "Candice Wu", salesRepId: "BC2022110004", departmentId: "BC2022110001", warehouseId: "BC2022110001", hireDate: "Jan 4, 2022", hireTime: "11:30 AM", phone: "+1 8639724863", isActive: true },
    ];


    return (
        <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobileOpen={isMobileSidebarOpen}
                toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <h2>Sales Reps</h2>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                {/* Table */}
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Active Sales Reps</h3>
                <DataTable
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Sales Rep"
                    onAddClick={() => { }}
                    onToggleStatus={(row) => console.log("Toggle", row.id)}
                    showFilter={true}
                />
            </div>
        </div>
    );
};

export default SalesReps;
