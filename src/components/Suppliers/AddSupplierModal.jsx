import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddSupplierModal.css';
import { addSupplier } from '../../api/supplierService';

const AddSupplierModal = ({ isOpen, onClose, onSupplierAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        creditPeriod: '',
        email: '',
        address: ''
    });

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
                address: formData.address
            };
            await addSupplier(supplierData);
            onSupplierAdded();
            onClose();
            setFormData({
                name: '',
                contactPerson: '',
                phoneNumber: '',
                creditPeriod: '',
                email: '',
                address: ''
            });
        } catch (error) {
            console.error("Error adding supplier:", error);
            alert("Failed to add supplier");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add New Supplier</h2>
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
                            <label className="form-label">Credit period *</label>
                            <select
                                name="creditPeriod"
                                className="form-input"
                                value={formData.creditPeriod}
                                onChange={handleChange}
                                required
                            >
                                <option value="">select</option>
                                <option value="cash">cash</option>
                                <option value="15 days">15 days</option>
                                <option value="30 days">30 days</option>
                                <option value="60 days">60 days</option>
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
                    <div className="modal-footer">
                        <button type="submit" className="submit-btn">Add Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;
