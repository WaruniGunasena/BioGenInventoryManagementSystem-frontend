import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import { Users, UserMinus, UserX } from 'lucide-react';
import '../components/Dashboard/Dashboard.css';

const Suppliers = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Metrics
    const metrics = [
        { title: "Active Suppliers", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Inactive Suppliers", value: 19, trend: { value: "12%", isPositive: true }, isPrimary: false },
        { title: "Deleted Suppliers", value: 10, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        {
            header: "Supplier Name / Company Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" />
                    <span>{row.name}</span>
                </div>
            )
        },
        { header: "Supplier ID", accessor: "supplierId" },
        { header: "Contact Person", accessor: "contactPerson" },
        { header: "Phone Number", accessor: "phone" },
        { header: "Address", accessor: "address" },
        { header: "Email", accessor: "email" },
    ];

    const data = [
        { id: 1, name: "BioMedicals Pvt. Ltd", supplierId: "BC2022110001", contactPerson: "Sandeepa", phone: "0713245623", address: "Colombo", email: "person@gmail.com", isActive: true },
        { id: 2, name: "Thomas Medicines", supplierId: "BC2022110002", contactPerson: "Waruni", phone: "0713245623", address: "Gampaha", email: "person@gmail.com", isActive: true },
        { id: 3, name: "Ananda Heath Pvt. Ltd", supplierId: "BC2022110003", contactPerson: "Nipuni", phone: "0713245623", address: "Ratnapura", email: "person@gmail.com", isActive: true },
        { id: 4, name: "abeyweera Medicines", supplierId: "BC2022110004", contactPerson: "Haritha C", phone: "0713245623", address: "Kaluthara", email: "person@gmail.com", isActive: true },
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
                    <h2>Suppliers</h2>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                {/* Table */}
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Active Suppliers</h3>
                <DataTable
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Supplier"
                    onAddClick={() => { }}
                    onToggleStatus={(row) => console.log("Toggle", row.id)}
                    showFilter={false} // Match design
                />
            </div>
        </div>
    );
};

export default Suppliers;
