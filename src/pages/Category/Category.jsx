import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/Sidebar';
import MetricCard from '../../components/common/MetricCard';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { Filter, Users, UserX } from 'lucide-react';
import { getAllCategory, createCategory, updateCategory, searchCategory, getPaginatedResults, softDeleteCategory } from '../../api/categoryService';
import AddCategory from '../../components/Category/AddCategory';
import FilterType from '../../enums/FilterType';
import { exportToCSV } from '../../components/common/Utils/Export/ExportToCSV';
import { exportToPDF } from '../../components/common/Utils/Export/ExportToPDF';
import { getUserId } from '../../components/common/Utils/userUtils/userUtils';
import usePermissions from '../../hooks/usePermissions';

const Category = () => {
    const { showToast } = useToast();
    const { canAdd, canEdit, canDelete } = usePermissions('categories');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [categories, setCategories] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [isExporting, setIsExporting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null,
        message: ''
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, SetFilter] = useState(FilterType.ASC);

    const [formData, setFormData] = useState({ name: '', description: '' });

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getPaginatedResults(currentPage, 5, filter)
            if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
                setCategories(response.data.categories);
                setTotalPages(response.data.totalPages);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filter]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);


    const handleOpenModal = (mode, category = null) => {
        setModalMode(mode);
        setSelectedCategory(category);
        setFormData(category ? { name: category.name, description: category.description } : { name: '', description: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmitClick = () => {
        if (modalMode === 'add') {
            performAction('add', formData);
        } else {
            performAction('edit', formData);
        }
    };

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: row,
            message: `Do you really want to delete the category "${row.name}"?`
        });
    };

    const handleConfirmAction = async () => {
        const { type, data } = confirmModal;

        try {
            if (type === 'delete') {
                const id = data.id || data._id;
                const userId = await getUserId();
                await softDeleteCategory(id, userId);
                fetchCategories();
                showToast('success', 'Category deleted successfully!');
            } else if (type === 'edit') {
                const id = selectedCategory.id || selectedCategory._id;
                await updateCategory(id, data);
                handleCloseModal();
                showToast('success', 'Category updated successfully!');
            } else if (type === 'add') {
                await createCategory(data);
                handleCloseModal();
                showToast('success', 'Category added successfully!');
            }

            fetchCategories();
        } catch (error) {
            showToast('error', 'Something went wrong. Please try again.');
        } finally {

            setConfirmModal({ isOpen: false, type: null, data: null, message: '' });
        }
    };

    const performAction = async (type, data) => {
        if (type === 'add') {
            try {
                await createCategory(data);
                fetchCategories();
                handleCloseModal();
                showToast('success', 'Category added successfully!');
            } catch (error) {
                console.error("Error creating category:", error);
                showToast('error', 'Failed to add category. Please try again.');
            }
        }
        if (type === 'edit') {
            try {
                const id = selectedCategory?.id || selectedCategory?._id;
                await updateCategory(id, data);
                fetchCategories();
                handleCloseModal();
                showToast('success', 'Category updated successfully!');
            } catch (error) {
                console.error("Error updating category:", error);
                showToast('error', 'Failed to update category. Please try again.');
            }
        }
    }

    const handleSearch = async (query) => {
        if (query.trim() === "") {
            fetchCategories();
            return;
        }
        try {
            const res = await searchCategory(query);
            setCategories(res.data.categories);
        } catch (error) {
            console.error("Error searching category:", error);
        }
    };

    const metrics = [
        { title: "Total Categories", value: categories.length.toString(), trend: { value: "12%", isPositive: true }, icon: Filter, isPrimary: true },
        { title: "Active Categories", value: categories.length.toString(), trend: { value: "0%", isPositive: true }, icon: Users },
        { title: "Inactive Categories", value: "0", trend: { value: "2%", isPositive: false }, icon: UserX },
    ];

    const columns = [
        { header: "Category Name", accessor: "name", render: (row) => <span style={{ fontWeight: '500', color: '#6366f1' }}>{row.name}</span> },
        { header: "Category ID", accessor: "_id", render: (row) => row.id },
        { header: "Description", accessor: "description" },
        // {
        //     header: "Products", accessor: "products", render: (row) => (
        //         <div className="product-avatars" style={{ display: 'flex' }}>
        //             {[1, 2, 3].map(i => (
        //                 <img key={i} src={`https://ui-avatars.com/api/?name=Product+${i}&background=random`}
        //                     style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid white', marginLeft: '-8px', firstOfType: { marginLeft: 0 } }}
        //                     alt=""
        //                 />
        //             ))}
        //         </div>
        //     )
        // },
    ];

    const handleFilter = (value) => {
        SetFilter(value ?? FilterType.ASC);
        setCurrentPage(0);
    }

    const handleExportToCsv = () => {
        exportToCSV({
            fetchData: async () => { const res = await getAllCategory(); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.categories ?? []),
            columnMap: [
                { key: 'id', label: 'Category ID' },
                { key: 'name', label: 'Category Name' },
                { key: 'description', label: 'Description' },
            ],
            filenamePrefix: 'categories',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    }

    const handleExportToPdf = () => {
        exportToPDF({
            fetchData: async () => { const res = await getAllCategory(); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.categories ?? []),
            columnMap: [
                { key: 'id', label: 'Category ID' },
                { key: 'name', label: 'Category Name' },
                { key: 'description', label: 'Description' },
            ],
            filenamePrefix: 'categories',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    }

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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>

                {isLoading && <div className="loading-overlay">Loading...</div>}

                <DataTable
                    columns={columns}
                    data={categories}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Category"
                    showAddButton={canAdd}
                    onAddClick={() => handleOpenModal('add')}
                    showActions={canEdit || canDelete}
                    onEdit={canEdit ? (row) => handleOpenModal('edit', row) : null}
                    onDelete={canDelete ? handleDeleteClick : null}
                    onSearch={handleSearch}
                    filterOptions={[
                        { label: 'Name: A → Z', value: FilterType.ASC },
                        { label: 'Name: Z → A', value: FilterType.DESC },
                    ]}
                    onFilter={handleFilter}
                    onExportCSV={isExporting ? undefined : handleExportToCsv}
                    onExportPDF={isExporting ? undefined : handleExportToPdf}
                    showStatusToggle={false}
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={modalMode === 'add' ? "Add New Category" : "Edit Category"}
                >
                    <AddCategory
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleFormSubmitClick={handleFormSubmitClick}
                        modalMode={modalMode}
                    />
                </Modal>

                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={handleConfirmAction}
                    message={confirmModal.message}
                    confirmLabel="Yes"
                    cancelLabel="No"
                    title={"Delete Category?"}
                />
            </div>
        </div>
    );
};

export default Category;
