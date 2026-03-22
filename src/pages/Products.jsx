import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/common/DataTable';
import ConfirmationModal from '../components/common/ConfirmationModal';
import '../components/Dashboard/Dashboard.css';
import Layout from '../components/Layout';
import { softDeleteProduct, searchProduct, getPaginatedProductResults, getAllProducts } from '../api/productService';
import { getAllCategory } from '../api/categoryService';
import { getUserId } from '../components/common/Utils/userUtils/userUtils';
import AddProductModal from '../components/Products/AddProductModal';
import EditProductModal from '../components/Products/EditProductModal';
import FilterType from '../enums/FilterType';
import { exportToCSV } from '../components/common/Utils/Export/ExportToCSV';
import { exportToPDF } from '../components/common/Utils/Export/ExportToPDF';
import usePermissions from '../hooks/usePermissions';

const Products = () => {

    const { showToast } = useToast();
    const { canAdd, canEdit, canDelete } = usePermissions('products');

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [filter, setFilter] = useState(FilterType.ASC);
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        data: null,
        message: ''
    });

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getPaginatedProductResults(currentPage, 5, filter, categoryId);
            if (response.data && response.data.products && Array.isArray(response.data.products)) {
                setProducts(response.data.products);
                setTotalPages(response.data.totalPages);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filter, categoryId]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await getAllCategory();
                let fetchedCategories = [];
                if (res.data && Array.isArray(res.data)) {
                    fetchedCategories = res.data;
                } else if (res.data && res.data.categories && Array.isArray(res.data.categories)) {
                    fetchedCategories = res.data.categories;
                }
                setCategories(fetchedCategories);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCats();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleProductAdded = () => {
        showToast('success', 'Product added successfully!');
        setIsAddModalOpen(false);
        fetchProducts();
    };

    const handleProductUpdated = () => {
        showToast('success', 'Product updated successfully!');
        setIsEditModalOpen(false);
        fetchProducts();
    };

    const handleExportToCsv = () => {
        exportToCSV({
            fetchData: async () => { const res = await getAllProducts(categoryId); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.products ?? []),
            columnMap: [
                { key: 'productID', label: 'Product ID' },
                { key: 'name', label: 'Product Name' },
                { key: 'categoryName', label: 'Category' },
                { key: 'packSize', label: 'Pack Size' },
                { key: 'unit', label: 'Unit'},
                { key: 'sellingPrice', label: 'Selling Price'},
                { key: 'mrp', label: 'MRP'}

            ],
            filenamePrefix: 'products',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    };

    const handleExportToPdf = () => {
        exportToPDF({
            fetchData: async () => { const res = await getAllProducts(categoryId); return res.data; },
            extractRows: (data) => Array.isArray(data) ? data : (data?.products ?? []),
            columnMap: [
                { key: 'productID', label: 'Product ID' },
                { key: 'name', label: 'Product Name' },
                { key: 'categoryName', label: 'Category' },
                { key: 'packSize', label: 'Pack Size' },
                { key: 'unit', label: 'Unit'},
                { key: 'sellingPrice', label: 'Selling Price'},
                { key: 'mrp', label: 'MRP'}
                
            ],
            title: 'Product List',
            filenamePrefix: 'products',
            onStart: () => setIsExporting(true),
            onEnd: () => setIsExporting(false),
        });
    };

    const handleDeleteClick = (row) => {
        setConfirmModal({
            isOpen: true,
            data: row,
            message: `Do you really want to delete the product "${row.name}"?`
        });
    };

    const handleConfirmDelete = async () => {
        const id = confirmModal.data.id || confirmModal.data._id;
        try {
            const userId = await getUserId();
            await softDeleteProduct(id, userId);
            showToast('success', 'Product deleted successfully!');
            fetchProducts();
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to delete product.');
        } finally {
            setConfirmModal({ isOpen: false, data: null, message: '' });
        }
    };

    const handleSearch = async (query) => {
        if (query.trim() === "") {
            fetchProducts();
            return;
        }
        try {
            const res = await searchProduct(query);
            setProducts(res.data.products);
        } catch (error) {
            console.error("Error searching products:", error);
        }
    };


    const columns = [
        {
            header: "Product Name", accessor: "name", render: (row) => (
                <div className="user-cell">
                    <img src={row.image ? row.image : `https://ui-avatars.com/api/?name=${row.name}&background=random`} alt="" className="user-avatar" style={{ borderRadius: '4px' }} />
                    <span style={{ fontWeight: '500' }}>{row.name}</span>
                </div>
            )
        },
        { header: "Category", accessor: "categoryName" },
        { header: "Pack Size", accessor: "packSize" },
        { header: "Opeining Balance", accessor: "openingBalance" },
        { header: "Min Stock", accessor: "minimumStockLevel" },
        { header: "Reorder Level", accessor: "reorderLevel" },
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
                    <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Products</h2>
                    </header>

                    {isLoading && <div className="loading-overlay">Loading...</div>}
                    <DataTable
                        columns={columns}
                        data={products}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        onSearch={handleSearch}
                        addButtonLabel="Add New Product"
                        showAddButton={canAdd}
                        onAddClick={() => setIsAddModalOpen(true)}
                        showActions={canEdit || canDelete}
                        onEdit={canEdit ? (row) => { setSelectedProduct(row); setIsEditModalOpen(true); } : null}
                        onDelete={canDelete ? handleDeleteClick : null}
                        customControls={
                            <select
                                className="btn-secondary"
                                style={{ padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
                                value={categoryId}
                                onChange={(e) => {
                                    setCategoryId(e.target.value);
                                    setCurrentPage(0);
                                }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.id || c._id} value={c.id || c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        }
                        filterOptions={[
                            { label: 'Ascending: A → Z', value: FilterType.ASC },
                            { label: 'Descending: Z → A', value: FilterType.DESC },
                        ]}
                        onFilter={(value) => {
                            setFilter(value ?? FilterType.ASC);
                            setCurrentPage(0);
                        }}
                        onExportCSV={isExporting ? undefined : handleExportToCsv}
                        onExportPDF={isExporting ? undefined : handleExportToPdf}
                    />

                    <AddProductModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onProductAdded={handleProductAdded}
                    />

                    <EditProductModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onProductUpdated={handleProductUpdated}
                        product={selectedProduct}
                    />

                    <ConfirmationModal
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                        onConfirm={handleConfirmDelete}
                        message={confirmModal.message}
                        confirmLabel="Yes"
                        cancelLabel="No"
                        title="Delete Product?"
                    />
                </div>
            </div>
        </Layout>
    );
};

export default Products;
