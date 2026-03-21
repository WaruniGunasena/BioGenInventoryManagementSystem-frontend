import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { updateCustomer } from '../../api/customerService';
import { useToast } from '../../context/ToastContext';
import './CustomerModal.css';

const EditCustomerModal = ({ isOpen, onClose, onCustomerUpdated, customer }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact_No: '',
        address: '',
        province: '',
        postalCode: '',
        creditPeriod: '',
        creditLimit: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name ?? '',
                email: customer.email ?? '',
                contact_No: customer.contact_No ?? '',
                address: customer.address ?? '',
                province: customer.province ?? '',
                postalCode: customer.postalCode ?? '',
                creditPeriod: customer.creditPeriod ?? '30',
                creditLimit: customer.creditLimit ?? '',
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const id = customer?.id ?? customer?._id;
        setIsSubmitting(true);
        try {
            const dataToSubmit = {
                customerId: id,
                ...formData,
                creditPeriod: parseInt(formData.creditPeriod, 10),
                creditLimit: formData.creditLimit !== '' && formData.creditLimit !== null ? parseFloat(formData.creditLimit) : null
            };
            await updateCustomer(id, dataToSubmit);
            showToast('success', 'Customer updated successfully!');
            onCustomerUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating customer:', error);
            showToast('error', error.response?.data?.message || 'Failed to update customer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer">
            <form onSubmit={handleSubmit}>

                <div className="form-row">
                    <div className="form-group form-col">
                        <label className="form-label">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group form-col">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group form-col">
                        <label className="form-label">Contact No</label>
                        <input
                            type="tel"
                            name="contact_No"
                            className="form-input"
                            placeholder="e.g. 071 234 5678"
                            value={formData.contact_No}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group form-col">
                        <label className="form-label">Province</label>
                        <input
                            type="text"
                            name="province"
                            className="form-input"
                            placeholder="Enter province"
                            value={formData.province}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group form-col">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            name="address"
                            className="form-input"
                            placeholder="Enter street address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group form-col">
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
                </div>

                <div className="form-row">
                    <div className="form-group form-col">
                        <label className="form-label">Credit Term *</label>
                        <select
                            name="creditPeriod"
                            className="form-input"
                            value={formData.creditPeriod}
                            onChange={handleChange}
                            required
                        >
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                            <option value="90">90 days</option>
                        </select>
                    </div>
                    <div className="form-group form-col">
                        <label className="form-label">Credit Limit</label>
                        <input
                            type="number"
                            name="creditLimit"
                            className="form-input"
                            placeholder="Enter credit limit"
                            value={formData.creditLimit}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary btn-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditCustomerModal;
