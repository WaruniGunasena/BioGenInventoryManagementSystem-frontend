import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import '../components/Dashboard/Dashboard.css';

const Category = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Metrics
    const metrics = [
        { title: "Active Categories", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Inactive Categories", value: 19, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        { header: "Category Name", accessor: "name" },
        { header: "Category ID", accessor: "categoryId" },
        { header: "Description", accessor: "description" },
        {
            header: "Products", accessor: "products", render: () => (
                <div style={{ display: 'flex' }}>
                    {[1, 2, 3].map(i => (
                        <img key={i} src={`https://ui-avatars.com/api/?name=P${i}&background=random`} alt="" className="user-avatar" style={{ marginLeft: i > 0 ? '-10px' : 0, border: '2px solid white' }} />
                    ))}
                    <span style={{ marginLeft: '5px', fontSize: '12px', alignSelf: 'center' }}>+5</span>
                </div>
            )
        },
    ];

    const data = [
        { id: 1, name: "Antibiotics", categoryId: "BC2022110001", description: "Used to treat bacterial infections", isActive: true },
        { id: 2, name: "Painkillers", categoryId: "BC2022110002", description: "Relieve pain and fever", isActive: true },
        { id: 3, name: "Vitamins & Supplements", categoryId: "BC2022110003", description: "Nutritional support", isActive: true },
        { id: 4, name: "Cold & Flu", categoryId: "BC2022110004", description: "Relieves cold and flu symptoms", isActive: true },
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
                    <h2>Category</h2>
                </header>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} />
                    ))}
                </div>

                {/* Table */}
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Active Categories</h3>
                <DataTable
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Category"
                    onAddClick={() => { }}
                    onToggleStatus={(row) => console.log("Toggle", row.id)}
                    showFilter={true}
                />
            </div>
        </div>
    );
};

export default Category;
