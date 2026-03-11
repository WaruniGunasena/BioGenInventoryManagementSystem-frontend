import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { Users, UserCheck, UserX } from 'lucide-react';
import {
    getPaginatedCustomers,
    searchCustomer,
    softDeleteCustomer
} from '../api/customerService';
import AddCustomerModal from '../components/Customers/AddCustomerModal';
import EditCustomerModal from '../components/Customers/EditCustomerModal';
import ViewCustomerModal from '../components/Customers/ViewCustomerModal';
import FilterType from '../enums/FilterType';
import { getUserId } from '../components/common/Utils/userUtils/userUtils';
import { useToast } from '../context/ToastContext';
import '../components/Dashboard/Dashboard.css';

const Customers = () => {
    const { showToast } = useToast();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState(FilterType.ASC);
    const [selectedIds, setSelectedIds] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewCustomer, setViewCustomer] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        data: null,
        message: '',
    });

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await getPaginatedCustomers(currentPage, 5, filter);
            const raw = response.data;

            if (!raw || typeof raw !== 'object') {
                setCustomers([]);
                setTotalPages(0);
                return;
            }

            let list = [];
            if (Array.isArray(raw)) {
                list = raw;
            } else if (Array.isArray(raw.customers)) {
                list = raw.customers;
            } else {
                const arrayKey = Object.keys(raw).find(k => Array.isArray(raw[k]));
                if (arrayKey) list = raw[arrayKey];
            }
            const pages =
                raw.totalPages ??
                raw.total_pages ??
                raw.pageCount ??
                raw.numberOfPages ??
                raw.totalPage ??
                0;

            setCustomers(list);
            setTotalPages(pages);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filter]);

    const handleSearch = async (query) => {
        if (query.trim() === '') {
            fetchCustomers();
            return;
        }
        try {
            const res = await searchCustomer(query);
            const raw = res.data;
            setCustomers(Array.isArray(raw) ? raw : (raw?.customers ?? []));
        } catch (err) {
            console.error('Error searching customers:', err);
        }
    };

    const handleFilter = (value) => {
        setFilter(value ?? FilterType.ASC);
        setCurrentPage(0);
    };

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            data: row,
            message: `Do you really want to delete the customer "${row.name}"?`,
        });
    };

    const handleConfirmDelete = async () => {
        const id = confirmModal.data?.id ?? confirmModal.data?._id;
        try {
            const userId = await getUserId();
            await softDeleteCustomer(id, userId);
            showToast('success', 'Customer deleted successfully!');
            fetchCustomers();
        } catch (err) {
            console.error('Error deleting customer:', err);
            showToast('error', err.response?.data?.message || 'Failed to delete customer.');
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: '' });
        }
    };

    const handleRowClick = (row) => {
        setViewCustomer(row);
        setIsViewModalOpen(true);
    };

    const handleCustomerAdded = () => {
        fetchCustomers();
        setIsAddModalOpen(false);
    };

    const handleCustomerUpdated = () => {
        fetchCustomers();
        setIsEditModalOpen(false);
    };

    const metrics = [
        {
            title: 'Total Customers',
            value: customers.length.toString(),
            trend: { value: '0%', isPositive: true },
            icon: Users,
            isPrimary: true,
        },
        {
            title: 'Active Customers',
            value: customers.filter(c => c.status !== 'inactive').length.toString(),
            trend: { value: '0%', isPositive: true },
            icon: UserCheck,
        },
        {
            title: 'Inactive Customers',
            value: customers.filter(c => c.status === 'inactive').length.toString(),
            trend: { value: '0%', isPositive: false },
            icon: UserX,
        },
    ];

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (row) => (
                <div className="user-cell">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.name ?? 'C')}&background=random`}
                        alt=""
                        className="user-avatar"
                    />
                    <span style={{ fontWeight: '500', color: '#6366f1' }}>{row.name}</span>
                </div>
            ),
        },
        {
            header: 'Customer ID',
            accessor: 'id',
            render: (row) => row.id ?? row._id ?? '—',
        },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Contact No',
            accessor: 'contact_No',
            render: (row) => row.contact_No ?? '—',
        },
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>

                {isLoading && <div className="loading-overlay">Loading...</div>}

                <DataTable
                    columns={columns}
                    data={customers}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Customer"
                    onAddClick={() => setIsAddModalOpen(true)}
                    onEdit={(row) => {
                        setSelectedCustomer(row);
                        setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteClick}
                    onSearch={handleSearch}
                    onRowClick={handleRowClick}
                    filterOptions={[
                        { label: 'Name: A → Z', value: FilterType.ASC },
                        { label: 'Name: Z → A', value: FilterType.DESC },
                    ]}
                    onFilter={handleFilter}
                    showStatusToggle={false}
                />

                <AddCustomerModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onCustomerAdded={handleCustomerAdded}
                />

                <EditCustomerModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onCustomerUpdated={handleCustomerUpdated}
                    customer={selectedCustomer}
                />

                <ViewCustomerModal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    customer={viewCustomer}
                />

                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={handleConfirmDelete}
                    message={confirmModal.message}
                    confirmLabel="Yes, Delete"
                    cancelLabel="Cancel"
                    title="Delete Customer?"
                />
            </div>
        </div>
    );
};

export default Customers;
