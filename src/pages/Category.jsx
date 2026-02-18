import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmationModal from '../components/common/ConfirmationModal'; // Import ConfirmationModal
import { Filter, Users, UserX } from 'lucide-react';
import '../components/Dashboard/Dashboard.css';
import { getAllCategory, createCategory, updateCategory, deleteCategory, searchCategory } from '../api/categoryService';

const Category = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // API Data State
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State (Add/Edit Form)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'delete' or 'edit'
        data: null, // item to delete or form data to save
        message: ''
    });

    // Form State
    const [formData, setFormData] = useState({ name: '', description: '' });

    // Fetch Categories
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await getAllCategory();
            if (response.data && Array.isArray(response.data)) {
                setCategories(response.data);
            } else if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
                setCategories(response.data.categories);
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setCategories(response.data.data);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // --- Add/Edit Modal Handlers ---

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
            // For Add, we might just submit directly or ask confirmation? 
            // User asked specifically for "Edit confirmation modal"
            // Let's assume Add is direct, Edit needs confirmation.
            performAction('add', formData);
        } else {
            // Open Confirmation for Edit
            setConfirmModal({
                isOpen: true,
                type: 'edit',
                data: formData,
                message: `Are you sure you want to update the category details?`
            });
            // Close the form modal temporarily or keep it open? 
            // Usually better to keep it open or close it. 
            // Let's keep it open and if confirmed, we do the action and close both.
        }
    };


    // --- Delete Handler ---

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: row,
            message: `Do you really want to delete the category "${row.name}"?`
        });
    };


    // --- Confirm Action Handler ---

    const handleConfirmAction = async () => {
        const { type, data } = confirmModal;

        try {
            if (type === 'delete') {
                const id = data.id || data._id;
                await deleteCategory(id);
            } else if (type === 'edit') {
                // For edit, 'data' is the formData, we need the ID from selectedCategory
                const id = selectedCategory.id || selectedCategory._id;
                await updateCategory(id, data);
                // Close the form modal as well since we finished editing
                handleCloseModal();
            } else if (type === 'add') {
                await createCategory(data);
                handleCloseModal();
            }

            fetchCategories(); // Refresh list
        } catch (error) {
            console.error(`Error performing ${type}:`, error);
        } finally {
            // Close Confirmation Modal
            setConfirmModal({ isOpen: false, type: null, data: null, message: '' });
        }
    };

    // Helper to perform action directly (used for Add if no confirm needed, but I'll make a unified helper)
    const performAction = async (type, data) => {
        if (type === 'add') {
            try {
                await createCategory(data);
                fetchCategories();
                handleCloseModal();
            } catch (error) {
                console.error("Error creating category:", error);
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


    // Metric Cards Data
    const metrics = [
        { title: "Total Categories", value: categories.length.toString(), trend: { value: "12%", isPositive: true }, icon: Filter, isPrimary: true },
        { title: "Active Categories", value: categories.length.toString(), trend: { value: "0%", isPositive: true }, icon: Users },
        { title: "Inactive Categories", value: "0", trend: { value: "2%", isPositive: false }, icon: UserX },
    ];

    // Table
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const columns = [
        { header: "Category Name", accessor: "name", render: (row) => <span style={{ fontWeight: '500', color: '#6366f1' }}>{row.name}</span> },
        { header: "Category ID", accessor: "_id", render: (row) => row.id },
        { header: "Description", accessor: "description" },
        {
            header: "Products", accessor: "products", render: (row) => (
                <div className="product-avatars" style={{ display: 'flex' }}>
                    {[1, 2, 3].map(i => (
                        <img key={i} src={`https://ui-avatars.com/api/?name=Product+${i}&background=random`}
                            style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid white', marginLeft: '-8px', firstOfType: { marginLeft: 0 } }}
                            alt=""
                        />
                    ))}
                </div>
            )
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
                    <h2>Category</h2>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>

                <DataTable
                    columns={columns}
                    data={categories}
                    currentPage={currentPage}
                    totalPages={1}
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Category"
                    onAddClick={() => handleOpenModal('add')}
                    onEdit={(row) => handleOpenModal('edit', row)}
                    onDelete={handleDeleteClick}
                    onSearch={handleSearch}
                />

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={modalMode === 'add' ? "Add New Category" : "Edit Category"}
                >
                    <div className="form-group">
                        <label className="form-label">Category Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Enter Category Name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            placeholder="Enter Description"
                            value={formData.description}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>
                    <div className="form-actions">
                        <button className="btn-primary btn-full" onClick={handleFormSubmitClick}>
                            {modalMode === 'add' ? "Add New Category" : "Save Changes"}
                        </button>
                    </div>
                </Modal>

                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    onConfirm={handleConfirmAction}
                    message={confirmModal.message}
                    confirmLabel="Yes"
                    cancelLabel="No"
                    title={confirmModal.type === 'delete' ? "Delete Category?" : "Update Category?"}
                />
            </div>
        </div>
    );
};

export default Category;
