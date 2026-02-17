import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/common/DataTable';
import { Calendar } from 'lucide-react'; // For 'Select dates' button
import '../components/Dashboard/Dashboard.css';

const Products = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // No Metric Cards for this page as per design

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        {
            header: "Product Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" style={{ borderRadius: '4px' }} />
                    <span style={{ fontWeight: '500' }}>{row.name}</span>
                </div>
            )
        },
        { header: "Product ID", accessor: "productId" },
        {
            header: "Supplier ID", accessor: "supplierId", render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', textDecoration: 'underline', color: '#4b5563' }}>
                    {row.supplierId}
                    {row.supplierCount && (
                        <span style={{
                            marginLeft: '5px',
                            fontSize: '11px',
                            background: '#e5e7eb',
                            padding: '1px 5px',
                            borderRadius: '10px'
                        }}>
                            +{row.supplierCount}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: "Category", accessor: "category", render: (row) => (
                <span style={{ textDecoration: 'underline', color: '#4b5563', fontWeight: '500' }}>{row.category}</span>
            )
        },
        { header: "Price(LKR)", accessor: "price" },
        { header: "Expiry Date", accessor: "expiryDate" },
        { header: "Stock Level (in units)", accessor: "stockLevel" },
        { header: "Rec. Level (in units)", accessor: "recLevel" },
    ];

    const data = [
        { id: 1, name: "Amoxicillin", productId: "TUX001234", supplierId: "REMA0123", supplierCount: 5, category: "Antibiotic", price: "15", expiryDate: "08/12/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 2, name: "Lisinopril", productId: "TUX001234", supplierId: "REMA0123", category: "Blood Pressure", price: "5", expiryDate: "12/05/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 3, name: "Metformin", productId: "TUX001234", supplierId: "REMA0123", supplierCount: 5, category: "Diabetes", price: "45", expiryDate: "09/27/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 4, name: "Atorvastatin", productId: "TUX001234", supplierId: "REMA0123", category: "Cholesterol", price: "34", expiryDate: "07/14/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 5, name: "Albuterol Inhaler", productId: "TUX001234", supplierId: "REMA0123", supplierCount: 5, category: "Inhaler", price: "23", expiryDate: "11/30/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 6, name: "Candice Wu", productId: "TUX001234", supplierId: "REMA0123", category: "Pain Relief", price: "12", expiryDate: "04/10/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 7, name: "Drew Cano", productId: "TUX001234", supplierId: "REMA0123", supplierCount: 5, category: "Supplements", price: "47", expiryDate: "06/18/2025", stockLevel: "12000", recLevel: "15000" },
        { id: 8, name: "OD Orlando Diggs", productId: "TUX001234", supplierId: "REMA0123", category: "Cough & Cold", price: "38", expiryDate: "10/22/2025", stockLevel: "12000", recLevel: "15000" },
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
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Products</h2>
                    <button className="btn-secondary">
                        <Calendar size={16} /> Select dates
                    </button>
                </header>

                {/* Table */}
                <DataTable
                    columns={columns}
                    data={data}
                    currentPage={currentPage}
                    totalPages={10}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    showAddButton={false}
                    addButtonLabel="Add New Product"
                    onAddClick={() => { }}
                    showCheckboxes={false} // Hide checkboxes specifically for this page
                    onToggleStatus={() => { }} // No status toggle in design? Wait, actions has edit/delete. Design doesn't show toggle.
                    // But actions column has edit/delete
                    // The design in image 1 (Products) shows Edit/Delete icons.
                    showFilter={true}
                    showActions={false}
                />
            </div>
        </div>
    );
};

export default Products;
