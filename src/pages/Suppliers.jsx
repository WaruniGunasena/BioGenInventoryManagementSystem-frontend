import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import ConfirmationModal from '../components/common/ConfirmationModal'; // Import ConfirmationModal
import { useNavigate } from 'react-router-dom';
import { getAllSuppliers, deleteSupplier, searchSupplier } from "../api/supplierService"
import '../components/Dashboard/Dashboard.css';
import Layout from '../components/Layout';
import AddSupplierModal from '../components/Suppliers/AddSupplierModal';
import EditSupplierModal from '../components/Suppliers/EditSupplierModal';

const Suppliers = () => {
    const { showToast } = useToast();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const metrics = [
        { title: "Active Suppliers", value: 100, trend: { value: "12%", isPositive: true }, isPrimary: true },
        { title: "Inactive Suppliers", value: 19, trend: { value: "12%", isPositive: true }, isPrimary: false },
        { title: "Deleted Suppliers", value: 10, trend: { value: "12%", isPositive: true }, isPrimary: false },
    ];

    const [supplier, setSupplier] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        data: null,
        message: ''
    });

    // eslint-disable-next-line no-unused-vars
    const navigate = useNavigate();

    const getSupplier = async () => {
        try {
            const response = await getAllSuppliers();
            if (response.data && Array.isArray(response.data)) {
                setSupplier(response.data);
            } else if (response.data && response.data.suppliers && Array.isArray(response.data.suppliers)) {
                setSupplier(response.data.suppliers);
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setSupplier(response.data.data);
            } else {
                setSupplier([]);
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to load suppliers.');
        }
    };

    useEffect(() => {
        getSupplier();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSupplierAdded = () => {
        showToast('success', 'Supplier added successfully!');
        setIsAddModalOpen(false);
        getSupplier();
    };

    const handleSupplierUpdated = () => {
        showToast('success', 'Supplier updated successfully!');
        setIsEditModalOpen(false);
        getSupplier();
    };

    // --- Delete Confirmation Handlers ---

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
            await deleteSupplier(id);
            showToast('success', 'Supplier deleted successfully!');
            getSupplier();
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to delete supplier.');
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: '' });
        }
    };

    const handleSearch = async (query) => {
        if (query.trim() === "") {
            getSupplier();
            return;
        }
        try {
            const res = await searchSupplier(query);
            if (res.data && Array.isArray(res.data)) {
                setSupplier(res.data);
            } else if (res.data && res.data.suppliers && Array.isArray(res.data.suppliers)) {
                setSupplier(res.data.suppliers);
            } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                setSupplier(res.data.data);
            } else {
                setSupplier([]);
            }
        } catch (error) {
            console.error("Error searching suppliers:", error);
        }
    };

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
        { header: "Contact Person", accessor: "contactPerson" },
        { header: "Phone Number", accessor: "phoneNumber" },
        { header: "Credit Period", accessor: "creditPeriod" },
        { header: "Email", accessor: "email" },
        { header: "Address", accessor: "address" },
        { header: "Postal Code", accessor: "postalCode" },
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

                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Active Suppliers</h3>
                    <DataTable
                        columns={columns}
                        data={supplier}
                        currentPage={currentPage}
                        totalPages={5}
                        onPageChange={setCurrentPage}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onSearch={handleSearch}
                        addButtonLabel="Add New Supplier"
                        onAddClick={() => setIsAddModalOpen(true)}
                        onEdit={(row) => {
                            setSelectedSupplier(row);
                            setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteClick}
                        onToggleStatus={(row) => console.log("Toggle", row.id || row._id)}
                        showFilter={false}
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

                    {/* Confirmation Modal */}
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
