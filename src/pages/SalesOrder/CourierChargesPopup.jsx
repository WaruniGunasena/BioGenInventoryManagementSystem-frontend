import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export const CourierChargesPopup = ({ initialCharge, onSave, onClose }) => {
    const [value, setValue] = useState(initialCharge || "");

    const handleSave = () => {
        onSave(value === "" ? "" : parseFloat(value));
    };

    return (
        <div style={{
            position: 'absolute',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            top: '100%',
            right: 0,
            marginTop: '8px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Set Courier Charges</span>
                <X size={14} onClick={onClose} style={{ cursor: 'pointer', color: '#999' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Rs.</span>
                <input 
                    type="Text" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                    placeholder="Amount"
                    autoFocus
                />
                <div 
                    onClick={handleSave} 
                    style={{ cursor: 'pointer', padding: '6px', background: '#e8f5e9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Check size={16} color="#2e7d32" />
                </div>
            </div>
        </div>
    );
};
