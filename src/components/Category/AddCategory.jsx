import React from 'react';

const AddCategory = ({ formData, handleInputChange, handleFormSubmitClick, modalMode }) => {
    return (
        <div>
            <div className="form-group">
                <label className="form-label">Category Name *</label>
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
                    maxLength={255}
                ></textarea>
            </div>
            <div className="form-actions">
                <button className="btn-primary btn-full" onClick={handleFormSubmitClick}>
                    {modalMode === 'add' ? "Add New Category" : "Save Changes"}
                </button>
            </div>
        </div>
    );
};

export default AddCategory;
