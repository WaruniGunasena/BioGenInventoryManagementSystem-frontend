import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/Sidebar';
import MetricCard from '../../components/common/MetricCard';
import DataTable from '../../components/common/DataTable';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Users, UserCheck, UserX } from 'lucide-react';
import {
    getAllEmployees,
    deleteEmployee,
    searchEmployee,
} from '../../api/employeeService';
import AddEmployeeModal from '../../components/Employees/AddEmployeeModal';
import EditEmployeeModal from '../../components/Employees/EditEmployeeModal';
import FilterType from '../../enums/FilterType';
import UserRole from '../../enums/UserRole';

const ROLE_LABELS = {
    [UserRole.CASHIER]: 'Cashier',
    [UserRole.DRIVER]: 'Driver',
    [UserRole.INVENTORY_MANAGER]: 'Inventory Manager',
    [UserRole.AREA_MANAGER]: 'Area Manager',
    [UserRole.DIRECTOR]: 'Director',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SALES_REP]: 'Sales Rep',
};

const Employees = () => {
    const { showToast } = useToast();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // API Data State
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        data: null,
        message: '',
    });

    // Table state
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filter, setFilter] = useState(FilterType.ASC);

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await getAllEmployees();
            const raw = response?.data;
            const list =
                Array.isArray(raw) ? raw :
                    Array.isArray(raw?.users) ? raw.users :
                        Array.isArray(raw?.employees) ? raw.employees :
                            [];
            setEmployees(list);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // ─── Search ───────────────────────────────────────────────────────────────

    const handleSearch = async (query) => {
        if (query.trim() === '') {
            fetchEmployees();
            return;
        }
        try {
            const res = await searchEmployee(query);
            const raw = res?.data;
            const list =
                Array.isArray(raw) ? raw :
                    Array.isArray(raw?.users) ? raw.users :
                        Array.isArray(raw?.employees) ? raw.employees :
                            [];
            setEmployees(list);
        } catch (err) {
            console.error('Error searching employees:', err);
        }
    };

    // ─── Filter ───────────────────────────────────────────────────────────────

    const handleFilter = (value) => {
        setFilter(value ?? FilterType.ASC);
    };

    const sortedEmployees = [...employees].sort((a, b) => {
        const nameA = (a.name ?? `${a.firstName} ${a.lastName}`).toLowerCase();
        const nameB = (b.name ?? `${b.firstName} ${b.lastName}`).toLowerCase();
        return filter === FilterType.ASC
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
    });

    // ─── Delete ───────────────────────────────────────────────────────────────

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            data: row,
            message: `Do you really want to remove "${row.name ?? `${row.firstName} ${row.lastName}`}" from the system?`,
        });
    };

    const handleConfirmDelete = async () => {
        const id = confirmModal.data?.id || confirmModal.data?._id;
        try {
            await deleteEmployee(id);
            showToast('success', 'Employee removed successfully!');
            fetchEmployees();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to remove employee.');
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: '' });
        }
    };

    // ─── Callbacks from modals ────────────────────────────────────────────────

    const handleEmployeeAdded = () => {
        showToast('success', 'Employee added successfully!');
        fetchEmployees();
        setIsAddModalOpen(false);
    };

    const handleEmployeeUpdated = () => {
        showToast('success', 'Employee updated successfully!');
        fetchEmployees();
        setIsEditModalOpen(false);
    };

    // ─── Metrics ──────────────────────────────────────────────────────────────

    const metrics = [
        {
            title: 'Total Employees',
            value: employees.length.toString(),
            trend: { value: '0%', isPositive: true },
            icon: Users,
            isPrimary: true,
        },
        {
            title: 'Active Employees',
            value: employees.filter(e => e.status !== 'inactive').length.toString(),
            trend: { value: '0%', isPositive: true },
            icon: UserCheck,
        },
        {
            title: 'Inactive Employees',
            value: employees.filter(e => e.status === 'inactive').length.toString(),
            trend: { value: '0%', isPositive: false },
            icon: UserX,
        },
    ];

    // ─── Table columns ────────────────────────────────────────────────────────

    const columns = [
        {
            header: 'Employee',
            accessor: 'name',
            render: (row) => {
                const displayName = row.name ?? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();
                return (
                    <div className="user-cell">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
                            alt=""
                            className="user-avatar"
                        />
                        <span style={{ fontWeight: '500', color: '#6366f1' }}>{displayName}</span>
                    </div>
                );
            },
        },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Role',
            accessor: 'role',
            render: (row) => {
                const roleBadgeStyle = {
                    [UserRole.ADMIN]: { background: '#ebf4ff', color: '#3182ce' },
                    [UserRole.DIRECTOR]: { background: '#f3e8ff', color: '#6b21a8' },
                    [UserRole.AREA_MANAGER]: { background: '#fef9c3', color: '#854d0e' },
                    [UserRole.INVENTORY_MANAGER]: { background: '#f0fff4', color: '#276749' },
                    [UserRole.SALES_REP]: { background: '#fff7ed', color: '#9a3412' },
                    [UserRole.CASHIER]: { background: '#f0f9ff', color: '#0369a1' },
                    [UserRole.DRIVER]: { background: '#fdf4ff', color: '#86198f' },
                };
                const style = roleBadgeStyle[row.role] ?? { background: '#f3f4f6', color: '#374151' };
                return (
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', ...style }}>
                        {ROLE_LABELS[row.role] ?? row.role ?? '—'}
                    </span>
                );
            },
        },
        { header: 'Contact', accessor: 'contactNumber', render: (row) => row.contactNumber ?? row.phoneNumber ?? '—' },
        { header: 'Address', accessor: 'address', render: (row) => row.address ?? '—' },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────

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
                    <h2>Employees</h2>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>

                <DataTable
                    columns={columns}
                    data={sortedEmployees}
                    currentPage={currentPage}
                    totalPages={1}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Employee"
                    onAddClick={() => setIsAddModalOpen(true)}
                    onEdit={(row) => {
                        setSelectedEmployee(row);
                        setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteClick}
                    onSearch={handleSearch}
                    filterOptions={[
                        { label: 'Name: A → Z', value: FilterType.ASC },
                        { label: 'Name: Z → A', value: FilterType.DESC },
                    ]}
                    onFilter={handleFilter}
                    showStatusToggle={false}
                />

                {/* Add Employee Modal */}
                <AddEmployeeModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onEmployeeAdded={handleEmployeeAdded}
                />

                {/* Edit Employee Modal */}
                <EditEmployeeModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onEmployeeUpdated={handleEmployeeUpdated}
                    employee={selectedEmployee}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={handleConfirmDelete}
                    message={confirmModal.message}
                    confirmLabel="Yes, Remove"
                    cancelLabel="Cancel"
                    title="Remove Employee?"
                />
            </div>
        </div>
    );
};

export default Employees;
