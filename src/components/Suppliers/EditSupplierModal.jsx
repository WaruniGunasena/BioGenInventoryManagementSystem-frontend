import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AddSupplierModal.css';
import { updateSupplier } from '../../api/supplierService';

const EditSupplierModal = ({ isOpen, onClose, onSupplierUpdated, supplier }) => {
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        creditPeriod: '',
        email: '',
        address: '',
        postalCode: ''
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                contactPerson: supplier.contactPerson || '',
                phoneNumber: supplier.phoneNumber || '',
                creditPeriod: supplier.creditPeriod || '',
                email: supplier.email || '',
                address: supplier.address || '',
                postalCode: supplier.postalCode || ''
            });
        }
    }, [supplier]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const supplierData = {
                name: formData.name,
                contactPerson: formData.contactPerson,
                phoneNumber: formData.phoneNumber,
                creditPeriod: formData.creditPeriod,
                email: formData.email,
                address: formData.address,
                postalCode: formData.postalCode
            };

            await updateSupplier(supplier.id || supplier._id, supplierData);
            onSupplierUpdated();
            onClose();
        } catch (error) {
            console.error("Error updating supplier:", error);
            alert("Failed to update supplier");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Supplier</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Supplier/Company Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="Enter Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Contact Person Name</label>
                            <input
                                type="text"
                                name="contactPerson"
                                className="form-input"
                                placeholder="Enter contact person name"
                                value={formData.contactPerson}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Phone number *</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                className="form-input"
                                placeholder="071 2345 837"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Credit period</label>
                            <select
                                name="creditPeriod"
                                className="form-input"
                                value={formData.creditPeriod}
                                onChange={handleChange}
                            >
                                <option value="">select</option>
                                <option value="30 days">30 days</option>
                                <option value="45 days">45 days</option>
                                <option value="50 days">50 days</option>
                                <option value="90 days">90 days</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter Email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            name="address"
                            className="form-input"
                            placeholder="Enter address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input
                            type="text"
                            name="postalCode"
                            className="form-input"
                            placeholder="Enter postal code"
                            value={formData.postalCode}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSupplierModal;
