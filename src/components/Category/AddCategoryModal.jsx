import React, { useState } from 'react';
import Modal from '../common/Modal';
import AddCategory from './AddCategory';
import { createCategory } from '../../api/categoryService';

const AddCategoryModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', description: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmitClick = async () => {
        try {
            const response = await createCategory(formData);
            if (onSuccess) {
                onSuccess(response.data);
            }
            setFormData({ name: '', description: '' });
            onClose();
        } catch (error) {
            console.error("Error creating category:", error);
            alert("Failed to create category");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Category"
        >
            <AddCategory
                formData={formData}
                handleInputChange={handleInputChange}
                handleFormSubmitClick={handleFormSubmitClick}
                modalMode="add"
            />
        </Modal>
    );
};

export default AddCategoryModal;
