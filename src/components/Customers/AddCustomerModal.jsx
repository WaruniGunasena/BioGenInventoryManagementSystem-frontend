import React, { useState } from 'react';
import Modal from '../common/Modal';
import { createCustomer, checkCustomerEmailExists } from '../../api/customerService';
import { useToast } from '../../context/ToastContext';
import './CustomerModal.css';

const EMPTY_FORM = {
    name: '',
    email: '',
    contact_No: '',
    address: '',
    province: '',
    postalCode: '',
};

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailError, setEmailError] = useState(false); // tracks duplicate email state

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear the email error highlight as soon as the user edits the email field
        if (name === 'email' && emailError) {
            setEmailError(false);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // ── Step 1: Check if email already exists ────────────────────────
            const emailCheckRes = await checkCustomerEmailExists(formData.email);
            const emailExists = emailCheckRes.data; // boolean from backend

            if (emailExists) {
                setEmailError(true); // turn the email field red
                showToast('error', 'This email address is already registered.');
                setIsSubmitting(false);
                return; // keep modal open — do NOT proceed
            }

            // ── Step 2: Email is unique — create the customer ─────────────────
            await createCustomer(formData);
            setFormData(EMPTY_FORM);
            setEmailError(false);
            showToast('success', 'Customer added successfully!');
            onCustomerAdded();
            onClose();
        } catch (error) {
            console.error('Error adding customer:', error);
            showToast('error', error.response?.data?.message || 'Failed to add customer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer">
            <form onSubmit={handleSubmit}>

                {/* Row 1: Name + Email */}
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
                        <label className="form-label" style={{ color: emailError ? '#ef4444' : undefined }}>
                            Email * {emailError && <span style={{ fontSize: '12px', fontWeight: 400 }}>— already registered</span>}
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                borderColor: emailError ? '#ef4444' : undefined,
                                backgroundColor: emailError ? '#fef2f2' : undefined,
                                color: emailError ? '#ef4444' : undefined,
                            }}
                        />
                    </div>
                </div>

                {/* Row 2: Contact No + Province */}
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

                {/* Row 3: Address + Postal Code */}
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

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary btn-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Checking...' : 'Add Customer'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCustomerModal;
