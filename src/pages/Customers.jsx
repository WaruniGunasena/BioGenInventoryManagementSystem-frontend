import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import '../components/Dashboard/Dashboard.css';

const Customers = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Metrics
    const metrics = [
        { title: "Active Customers", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Inactive Customers", value: 19, trend: { value: "12%", isPositive: true }, isPrimary: false },
        { title: "Deleted Customers", value: 10, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        {
            header: "Contact Name/Company Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" />
                    <span>{row.name}</span>
                </div>
            )
        },
        { header: "Customer ID", accessor: "customerId" },
        { header: "Email", accessor: "email" },
        { header: "Address", accessor: "address" },
        { header: "Phone Number", accessor: "phone" },
    ];

    const data = [
        { id: 1, name: "Dasun Gamage", customerId: "BC2022110001", email: "person@gmail.com", address: "Ratnapura", phone: "0715212317", isActive: true },
        { id: 2, name: "Yahani Yapoorna", customerId: "BC2022110001", email: "person@gmail.com", address: "Hambantota", phone: "0715212317", isActive: true },
        { id: 3, name: "Sandun MediCare", customerId: "BC2022110001", email: "person@gmail.com", address: "Galle", phone: "0715212317", isActive: true },
        { id: 4, name: "CelonMed", customerId: "BC2022110001", email: "person@gmail.com", address: "Ratnapura", phone: "0715212317", isActive: true },
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
                    <h2>Customers</h2>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                {/* Table */}
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Active Customer</h3>
                <DataTable
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Customer" // Note: Button seems missing in user Design for Customer page but I will keep it consistent or follow design? 
                    // Design has Export button but seemingly no Add New - wait, design has "Export" but no "Add New" button in the screenshot for Customers compared to others?
                    // Actually, screenshot 4 shows "Export" button on right, no "Add New".
                    // I will hide Add Button for Customers if I follow screenshot exactly. but logically there should be one.
                    // I'll show it for now, user can hide it via props if needed.
                    // Actually looking closer at image 4, there is ONLY export.
                    showAddButton={false}
                    onAddClick={() => { }}
                    onToggleStatus={(row) => console.log("Toggle", row.id)}
                    showFilter={true}
                />
            </div>
        </div>
    );
};

export default Customers;
