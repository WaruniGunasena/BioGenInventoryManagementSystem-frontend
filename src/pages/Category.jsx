import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/common/MetricCard';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal'; // Import Modal
import { Filter, Users, UserX } from 'lucide-react';
import '../components/Dashboard/Dashboard.css';
import { getAllCategory, createCategory, updateCategory, deleteCategory } from '../api/categoryService';

const Category = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // API Data State
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // const [error, setError] = useState(null); // Optional: Handle errors

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', description: '' });

    // Fetch Categories
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await getAllCategory();
            console.log("API Response:", response);
            if (response.data && response.data.categories && Array.isArray(response.data.categories)) {
                setCategories(response.data.categories);
            } else {
                console.error("Unexpected response format:", response);
                setCategories([]);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            // setError("Failed to load categories.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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

    const handleSubmit = async () => {
        try {
            console.log("Form data", formData)
            if (modalMode === 'add') {
                console.log("inside formData")
                await createCategory(formData);
            } else {
                // Determine ID field (id or _id)
                const id = selectedCategory.id || selectedCategory._id;
                await updateCategory(id, formData);
            }
            fetchCategories(); // Refresh list
            handleCloseModal();
        } catch (error) {
            console.error("Error saving category:", error);
            // Handle error (e.g., show toast)
        }
    };

    const handleDelete = async (row) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                const id = row.id || row._id;
                await deleteCategory(id);
                fetchCategories(); // Refresh list
            } catch (error) {
                console.error("Error deleting category:", error);
            }
        }
    };

    // Metric Cards Data (Static for now, could be calculated from categories)
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
        { header: "Category ID", accessor: "_id", render: (row) => row.categoryId || row._id }, // Fallback for ID
        { header: "Description", accessor: "description" },
        {
            header: "Products", accessor: "products", render: (row) => (
                <div className="product-avatars" style={{ display: 'flex' }}>
                    {/* Dummy avatar group for now */}
                    {[1, 2, 3].map(i => (
                        <img key={i} src={`https://ui-avatars.com/api/?name=Product+${i}&background=random`}
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                border: '2px solid white',
                                marginLeft: '-8px',
                                firstOfType: { marginLeft: 0 }
                            }}
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
                    data={categories} // Use API data
                    currentPage={currentPage}
                    totalPages={1} // TODO: Implement backend pagination if available
                    onPageChange={setCurrentPage}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    addButtonLabel="Add New Category"
                    onAddClick={() => handleOpenModal('add')}
                    onEdit={(row) => handleOpenModal('edit', row)}
                    onDelete={handleDelete}
                    showFilter={true}
                />

                {/* Reusable Modal */}
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
                        <button className="btn-primary btn-full" onClick={handleSubmit}>
                            {modalMode === 'add' ? "Add New Category" : "Save Changes"}
                        </button>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Category;
