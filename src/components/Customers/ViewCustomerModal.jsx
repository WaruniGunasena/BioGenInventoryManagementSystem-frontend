import React from 'react';
import Modal from '../common/Modal';
import './CustomerModal.css';

/**
 * ViewCustomerModal — read-only modal opened when a table row is clicked.
 * Shows ALL customer fields as static text. No inputs, no save button.
 */
const ViewCustomerModal = ({ isOpen, onClose, customer }) => {
    if (!customer) return null;

    const fields = [
        { label: 'Customer ID', value: customer.id ?? customer._id },
        { label: 'Full Name', value: customer.name },
        { label: 'Email', value: customer.email },
        { label: 'Contact No', value: customer.contact_No },
        { label: 'Province', value: customer.province },
        { label: 'Address', value: customer.address },
        { label: 'Postal Code', value: customer.postalCode },
    ];

    const ReadOnlyField = ({ label, value }) => (
        <div className="form-group form-col">
            <label className="form-label">{label}</label>
            <div style={{
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                color: value ? '#1f2937' : '#9ca3af',
                background: '#f9fafb',
                minHeight: '40px',
                lineHeight: '1.5',
            }}>
                {value || '—'}
            </div>
        </div>
    );

    // Pair fields into 2-column rows
    const rows = [];
    for (let i = 0; i < fields.length; i += 2) {
        rows.push(fields.slice(i, i + 2));
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customer Details">
            <div>
                {rows.map((pair, rowIdx) => (
                    <div className="form-row" key={rowIdx} style={{ marginBottom: 0 }}>
                        {pair.map(field => (
                            <ReadOnlyField key={field.label} label={field.label} value={field.value} />
                        ))}
                        {pair.length === 1 && <div className="form-col" />}
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default ViewCustomerModal;
