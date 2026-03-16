import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import ConfirmationModal from '../components/common/ConfirmationModal';

import { softDeleteSupplier, searchSupplier, getPaginatedSupplierResults, getAllSuppliers } from "../api/supplierService"
import { getUserId } from '../components/common/Utils/userUtils/userUtils';
import FilterType from '../enums/FilterType';
import { exportToCSV } from '../components/common/Utils/Export/ExportToCSV';
import { exportToPDF } from '../components/common/Utils/Export/ExportToPDF';
import '../components/Dashboard/Dashboard.css';
import Layout from '../components/Layout';
import usePermissions from '../hooks/usePermissions';
import AddSupplierModal from '../components/Suppliers/AddSupplierModal';
import EditSupplierModal from '../components/Suppliers/EditSupplierModal';

const Suppliers = () => {
    const { showToast } = useToast();
    const { canAdd, canEdit, canDelete } = usePermissions('suppliers');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState(FilterType.ASC);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        data: null,
        message: ''
    });


    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getPaginatedSupplierResults(currentPage, 5, filter);
            if (response.data && response.data.suppliers && Array.isArray(response.data.suppliers)) {
                setSuppliers(response.data.suppliers);
                setTotalPages(response.data.totalPages);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to load suppliers.');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filter, showToast]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSupplierAdded = () => {
        showToast('success', 'Supplier added successfully!');
        setIsAddModalOpen(false);
        fetchSuppliers();
    };

    const handleSupplierUpdated = () => {
        showToast('success', 'Supplier updated successfully!');
        setIsEditModalOpen(false);
        fetchSuppliers();
    };

    const handleExportToCsv = () => {
        exportToCSV({
            fetchData: async () => { const res = await getAllSuppliers(); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.suppliers ?? []),
            columnMap: [
                { key: 'id', label: 'Supplier ID' },
                { key: 'name', label: 'Supplier/Company' },
                { key: 'contactPerson', label: 'Contact Person' },
                { key: 'phoneNumber', label: 'Phone Number' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'creditPeriod', label: 'Credit Period' }
            ],
            filenamePrefix: 'suppliers',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    };

    const handleExportToPdf = () => {
        exportToPDF({
            fetchData: async () => { const res = await getAllSuppliers(); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.suppliers ?? []),
            columnMap: [
                { key: 'id', label: 'Supplier ID' },
                { key: 'name', label: 'Supplier/Company' },
                { key: 'contactPerson', label: 'Contact Person' },
                { key: 'phoneNumber', label: 'Phone Number' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'creditPeriod', label: 'Credit Period' }
            ],
            title: 'Supplier List',
            filenamePrefix: 'suppliers',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    };

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            data: row,
            message: `Do you really want to delete the supplier "${row.name}"?`
        });
    };

    const handleConfirmDelete = async () => {
        const id = confirmModal.data.id || confirmModal.data._id;
        try {
            const userId = await getUserId();
            await softDeleteSupplier(id, userId);
            showToast('success', 'Supplier deleted successfully!');
            fetchSuppliers();
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to delete supplier.');
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: '' });
        }
    };

    const handleSearch = async (query) => {
        if (query.trim() === "") {
            fetchSuppliers();
            return;
        }
        try {
            const res = await searchSupplier(query);
            if (res.data && res.data.suppliers && Array.isArray(res.data.suppliers)) {
                setSuppliers(res.data.suppliers);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            console.error("Error searching suppliers:", error);
        }
    };

    const metrics = [
        { title: "Total Suppliers", value: suppliers.length.toString(), trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Active Suppliers", value: suppliers.length.toString(), trend: { value: "0%", isPositive: true }, isPrimary: false },
        { title: "Inactive Suppliers", value: "0", trend: { value: "0%", isPositive: true }, isPrimary: false },
    ];


    const columns = [
        {
            header: "Supplier Name / Company Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" />
                    <span style={{ fontWeight: '500', color: '#6366f1' }}>{row.name}</span>
                </div>
            )
        },
        { header: "Contact Person", accessor: "contactPerson" },
        { header: "Phone Number", accessor: "phoneNumber" },
        { header: "Credit Period", accessor: "creditPeriod" },
        { header: "Email", accessor: "email" },
        { header: "Address", accessor: "address" }
    ];

    return (
        <Layout>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        {metrics.map((m, i) => (
                            <MetricCard key={i} {...m} />
                        ))}
                    </div>

                    {isLoading && <div className="loading-overlay">Loading...</div>}
                    <DataTable
                        columns={columns}
                        data={suppliers}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onSearch={handleSearch}
                        addButtonLabel="Add New Supplier"
                        showAddButton={canAdd}
                        onAddClick={() => setIsAddModalOpen(true)}
                        showActions={canEdit || canDelete}
                        onEdit={canEdit ? (row) => { setSelectedSupplier(row); setIsEditModalOpen(true); } : null}
                        onDelete={canDelete ? handleDeleteClick : null}
                        filterOptions={[
                            { label: 'Name: A \u2192 Z', value: FilterType.ASC },
                            { label: 'Name: Z \u2192 A', value: FilterType.DESC },
                        ]}
                        onFilter={(value) => {
                            setFilter(value ?? FilterType.ASC);
                            setCurrentPage(0);
                        }}
                        onExportCSV={isExporting ? undefined : handleExportToCsv}
                        onExportPDF={isExporting ? undefined : handleExportToPdf}
                    />
                    <AddSupplierModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onSupplierAdded={handleSupplierAdded}
                    />
                    <EditSupplierModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSupplierUpdated={handleSupplierUpdated}
                        supplier={selectedSupplier}
                    />
                    <ConfirmationModal
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                        onConfirm={handleConfirmDelete}
                        message={confirmModal.message}
                        confirmLabel="Yes"
                        cancelLabel="No"
                        title="Delete Supplier?"
                    />
                </div>
            </div>
        </Layout>
    );
};

export default Suppliers;
