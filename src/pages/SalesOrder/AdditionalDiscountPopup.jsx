import React, { useState } from 'react';
import { Percent, DollarSign, X, Check } from 'lucide-react';
import { DiscountTypeEnum } from '../../enums/DiscountTypeEnum';

export const AdditionalDiscountPopup = ({ initialDiscount, onSave, onClose }) => {
    const [type, setType] = useState(initialDiscount?.type || DiscountTypeEnum.cash);
    const [value, setValue] = useState(initialDiscount?.value || "");

    const handleSave = () => {
        onSave({ type, value: value === "" ? "" : parseFloat(value) });
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
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Set Discount</span>
                <X size={14} onClick={onClose} style={{ cursor: 'pointer', color: '#999' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                    onClick={() => setType(type === DiscountTypeEnum.cash ? DiscountTypeEnum.percentage : DiscountTypeEnum.cash)} 
                    style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '6px', 
                        background: '#f5f5f5', 
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                    }}
                    title={type === DiscountTypeEnum.cash ? "Switch to Percentage" : "Switch to Cash"}
                >
                    {type === DiscountTypeEnum.cash ? <DollarSign size={16} color="#333" /> : <Percent size={16} color="#333" />}
                </div>
                <input 
                    type="number" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                    placeholder="Enter value"
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
