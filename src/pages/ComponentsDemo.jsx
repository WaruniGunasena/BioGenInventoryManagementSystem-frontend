import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import { Users } from 'lucide-react';
import '../components/Dashboard/Dashboard.css'; // Reuse dashboard layout styles

const ComponentsDemo = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Metric Data
    const metrics = [
        { title: "Active Suppliers", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true, icon: Users },
        { title: "Inactive Suppliers", value: 19, trend: { value: "12%", isPositive: false }, isPrimary: false },
        { title: "Deleted Suppliers", value: 10, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    // Table Data
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        {
            header: "Supplier Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" />
                    <span>{row.name}</span>
                </div>
            )
        },
        { header: "Supplier ID", accessor: "supplierId" },
        { header: "Phone", accessor: "phone" },
        { header: "Email", accessor: "email" },
        {
            header: "Status", accessor: "status", render: (row) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: row.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                    color: row.status === 'Active' ? '#166534' : '#374151',
                    fontSize: '12px'
                }}>
                    {row.status}
                </span>
            )
        },
    ];

    const data = [
        { id: 1, name: "BioMedicals Pvt. Ltd", supplierId: "BC2022110001", phone: "0713245623", email: "person@gmail.com", status: "Active" },
        { id: 2, name: "Thomas Medicines", supplierId: "BC2022110002", phone: "0713245623", email: "person@gmail.com", status: "Active" },
        { id: 3, name: "Ananda Heath Pvt. Ltd", supplierId: "BC2022110003", phone: "0713245623", email: "person@gmail.com", status: "Inactive" },
        { id: 4, name: "Medicare", supplierId: "BC2022110004", phone: "0713245623", email: "person@gmail.com", status: "Active" },
    ];

    return (
        <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <h2>Components Demo</h2>
                </header>

                {/* Metrics Section */}
                <h3 style={{ margin: '20px 0' }}>Metric Cards</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                {/* Table Section */}
                <h3 style={{ margin: '40px 0 20px 0' }}>Data Table</h3>
                <DataTable
                    title="Active Suppliers"
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Supplier"
                    onAddClick={() => alert('Add Clicked')}
                    onEdit={(row) => alert(`Edit ${row.name}`)}
                    onDelete={(row) => alert(`Delete ${row.name}`)}
                />
            </div>
        </div>
    );
};

export default ComponentsDemo;
