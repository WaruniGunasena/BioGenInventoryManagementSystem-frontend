import React, { useState, useEffect } from 'react';
import { X, Upload, PlusCircle } from 'lucide-react';
import './AddProductModal.css';
import { addProduct } from '../../api/productService';
import { getAllCategory } from '../../api/categoryService';
import AddCategoryModal from '../Category/AddCategoryModal';

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        description: '',
        unit: '',
        customUnit: '',
        minimumStockLevel: '',
        reorderLevel: '',
        packSize: '',
        openingBalance: '',
        sRepCommissionRate: '',
        sellingPrice: '',
        mrp: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isCustomUnit, setIsCustomUnit] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async (newCategoryId = null) => {
        try {
            const res = await getAllCategory();
            let fetchedCategories = [];
            if (res.data && Array.isArray(res.data)) {
                fetchedCategories = res.data;
            } else if (res.data && res.data.categories && Array.isArray(res.data.categories)) {
                fetchedCategories = res.data.categories;
            }
            setCategories(fetchedCategories);

            if (newCategoryId) {
                setFormData(prev => ({ ...prev, categoryId: newCategoryId }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'unit') {
            if (value === 'Other') {
                setIsCustomUnit(true);
                setFormData(prev => ({ ...prev, unit: 'Other' }));
            } else {
                setIsCustomUnit(false);
                setFormData(prev => ({ ...prev, unit: value, customUnit: '' }));
            }
        } else if (name === 'sRepCommissionRate') {
            // Allow empty string (cleared field) or valid decimal input
            if (value === '' || value === '-') {
                setFormData(prev => ({ ...prev, [name]: value }));
            } else {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    const clamped = Math.min(100, Math.max(0, num));
                    setFormData(prev => ({ ...prev, [name]: clamped }));
                }
            }
        } else {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('categoryId', formData.categoryId);
            data.append('description', formData.description);
            data.append('unit', isCustomUnit ? formData.customUnit : formData.unit);
            data.append('packSize', formData.packSize);
            data.append('minimumStockLevel', Number(formData.minimumStockLevel || 0));
            data.append('reorderLevel', Number(formData.reorderLevel || 0));
            data.append('openingBalance', Number(formData.openingBalance || 0));
            data.append('sRepCommissionRate', parseFloat(formData.sRepCommissionRate || 0));
            data.append('sellingPrice', Number(formData.sellingPrice || 0));
            data.append('mrp', Number(formData.mrp || 0));
            if (imageFile) {
                data.append('imageFile', imageFile);
            }

            await addProduct(data);
            onProductAdded();
            onClose();
            setFormData({
                name: '',
                categoryId: '',
                description: '',
                unit: '',
                customUnit: '',
                minimumStockLevel: '',
                reorderLevel: '',
                packSize: '',
                openingBalance: '',
                sRepCommissionRate: '',
                sellingPrice: '',
                mrp: ''
            });
            setImageFile(null);
            setImagePreview(null);
            setIsCustomUnit(false);
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product");
        }

    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add New Product</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="Enter product Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Product Category *</label>
                            <select
                                name="categoryId"
                                className="form-input"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="add-category-btn-container">
                                <button
                                    type="button"
                                    className="add-category-inline-btn"
                                    onClick={() => setIsAddCategoryModalOpen(true)}
                                >
                                    <PlusCircle size={16} />
                                    Add New Category
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Unit</label>
                            {!isCustomUnit ? (
                                <select
                                    name="unit"
                                    className="form-input"
                                    value={formData.unit}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="PCS">PCS</option>
                                    <option value="Bottle">Bottle</option>
                                    <option value="Other">Enter...</option>
                                </select>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        name="customUnit"
                                        className="form-input"
                                        placeholder="Enter unit"
                                        value={formData.customUnit}
                                        onChange={handleChange}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="close-btn"
                                        onClick={() => setIsCustomUnit(false)}
                                        style={{ padding: '8px' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="form-col">
                            <label className="form-label">Pack Size</label>
                            <input
                                type="text"
                                name="packSize"
                                className="form-input"
                                placeholder="Enter pack size"
                                value={formData.packSize}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Minimum Stock Level</label>
                            <input
                                type="number"
                                name="minimumStockLevel"
                                className="form-input"
                                placeholder="0"
                                value={formData.minimumStockLevel}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Re-order Level</label>
                            <input
                                type="number"
                                name="reorderLevel"
                                className="form-input"
                                placeholder="0"
                                value={formData.reorderLevel}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Opening Balance</label>
                            <input
                                type="number"
                                name="openingBalance"
                                className="form-input"
                                placeholder="0"
                                value={formData.openingBalance}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Sales Rep Commission Rate (%)</label>
                            <input
                                type="number"
                                step={0.01}
                                name="sRepCommissionRate"
                                className="form-input"
                                placeholder="0-100"
                                min="0"
                                max="100"
                                value={formData.sRepCommissionRate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Selling Price</label>
                            <input
                                type="number"
                                name="sellingPrice"
                                className="form-input"
                                placeholder="0.00"
                                step="0.01"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">MRP</label>
                            <input
                                type="number"
                                name="mrp"
                                className="form-input"
                                placeholder="0.00"
                                step="0.01"
                                value={formData.mrp}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Product Description</label>
                            <textarea
                                name="description"
                                className="form-input"
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={handleChange}
                                style={{ height: '80px', resize: 'none' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Product image</label>
                        <div className="image-upload-container" onClick={() => document.getElementById('image-upload').click()}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="image-preview" />
                            ) : (
                                <div style={{ color: '#666', textAlign: 'center' }}>
                                    <Upload size={24} style={{ marginBottom: '8px' }} />
                                    <p>click to upload image</p>
                                </div>
                            )}
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="submit-btn">Add product</button>
                    </div>
                </form>

                <AddCategoryModal
                    isOpen={isAddCategoryModalOpen}
                    onClose={() => setIsAddCategoryModalOpen(false)}
                    onSuccess={(newCategory) => {
                        fetchCategories(newCategory.id || newCategory._id);
                    }}
                />
            </div>
        </div>
    );
};

export default AddProductModal;
