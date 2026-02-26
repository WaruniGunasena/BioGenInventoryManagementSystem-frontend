import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './EmployeeModal.css';
import { updateEmployee } from '../../api/employeeService';
import UserRole from '../../enums/UserRole';

const ROLE_LABELS = {
    [UserRole.CASHIER]: 'Cashier',
    [UserRole.DRIVER]: 'Driver',
    [UserRole.INVENTORY_MANAGER]: 'Inventory Manager',
    [UserRole.AREA_MANAGER]: 'Area Manager',
    [UserRole.DIRECTOR]: 'Director',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.SALES_REP]: 'Sales Rep',
};

const EditEmployeeModal = ({ isOpen, onClose, onEmployeeUpdated, employee }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        address: '',
        role: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill form when employee changes
    useEffect(() => {
        if (employee) {
            setFormData({
                firstName: employee.firstName ?? (employee.name?.split(' ')[0] ?? ''),
                lastName: employee.lastName ?? (employee.name?.split(' ').slice(1).join(' ') ?? ''),
                email: employee.email ?? '',
                contactNumber: employee.contactNumber ?? employee.phoneNumber ?? '',
                address: employee.address ?? '',
                role: employee.role ?? '',
            });
            setError('');
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const id = employee.id || employee._id;
            await updateEmployee(id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                name: `${formData.firstName} ${formData.lastName}`,
                contactNumber: formData.contactNumber,
                address: formData.address,
                role: formData.role,
            });
            onEmployeeUpdated();
            onClose();
        } catch (err) {
            console.error('Error updating employee:', err);
            setError(err.response?.data?.message || 'Failed to update employee. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit Employee</h2>
                    <button className="close-btn" onClick={onClose} type="button">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                placeholder="Enter first name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                placeholder="Enter last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            disabled
                            title="Email cannot be changed"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-col">
                            <label className="form-label">Contact Number</label>
                            <input
                                type="tel"
                                name="contactNumber"
                                className="form-input"
                                placeholder="071 2345 678"
                                value={formData.contactNumber}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-col">
                            <label className="form-label">Role *</label>
                            <select
                                name="role"
                                className="form-input"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a role</option>
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
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

                    {error && (
                        <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
                    )}

                    <div className="modal-footer">
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
