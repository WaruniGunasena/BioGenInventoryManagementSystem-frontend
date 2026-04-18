import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import "./ReturnCreditsModal.css";

const ReturnCreditsModal = ({ isOpen, onClose, summaryData, onApply }) => {
    const [applyCreditAmount, setApplyCreditAmount] = useState("");
    const [reissueSelections, setReissueSelections] = useState({});

    useEffect(() => {
        if (isOpen) {
            setApplyCreditAmount("");
            setReissueSelections({});
        }
    }, [isOpen]);

    if (!isOpen || !summaryData) return null;

    const availableCredit = summaryData.customerCurrentDue || 0;
    const returnProducts = summaryData.returnProducts || [];

    const handleReissueChange = (productId, value, maxQty) => {
        let val = parseFloat(value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > maxQty) val = maxQty;

        setReissueSelections(prev => ({
            ...prev,
            [productId]: val
        }));
    };

    const handleApply = () => {
        const creditAmount = parseFloat(applyCreditAmount) || 0;
        
        let selectedItems = [];
        returnProducts.forEach(item => {
            const currentProdId = item.productId || item.product?.id || item.product?._id;
            const qty = reissueSelections[currentProdId] || 0;
            if (qty > 0) {
                selectedItems.push({
                    productId: currentProdId,
                    productName: item.productName || item.product?.name,
                    unit: item.unit || item.product?.unit || "",
                    packSize: item.packSize || item.product?.packSize || "",
                    quantity: qty, // Note: This will be added as bonus/free-issue
                    mrp: item.mrp || item.product?.mrp || 0,
                    sellingPrice: 0,
                    totalAmount: 0 // Free issue
                });
            }
        });

        onApply(creditAmount, selectedItems);
        onClose();
    };

    return (
        <div className="return-credits-modal-overlay">
            <div className="return-credits-modal-content">
                <div className="rc-modal-header">
                    <h3>Available Return Credits & Reissues</h3>
                    <button className="rc-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="rc-modal-body">
                    {availableCredit > 0 && (
                        <div className="rc-section rc-cash-credits">
                            <h4>Return Cash Credit</h4>
                            <p className="rc-info">
                                <AlertCircle size={16} /> Customer has an available credit balance of <strong>Rs. {availableCredit.toFixed(2)}</strong>.
                            </p>
                            <div className="rc-input-group">
                                <label>Apply Credit Amount (Rs.):</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max={availableCredit} 
                                    value={applyCreditAmount}
                                    placeholder="0.00"
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value);
                                        if (val > availableCredit) val = availableCredit;
                                        setApplyCreditAmount(val >= 0 ? val : "");
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {returnProducts.length > 0 && (
                        <div className="rc-section rc-reissue-items">
                            <h4>Pending Reissue Products</h4>
                            <p className="rc-info">
                                <AlertCircle size={16} /> Select quantities to reissue as free-items.
                            </p>
                            <table className="rc-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Remaining to Reissue</th>
                                        <th>Qty to Apply</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnProducts.map((item, idx) => {
                                        const prodId = item.productId || item.product?.id || item.product?._id;
                                        const maxQty = item.quantityRemainingToReissue !== undefined ? item.quantityRemainingToReissue : (item.quantityRemaining || item.quantity || 0);
                                        return (
                                            <tr key={idx}>
                                                <td>{item.productName || item.product?.name || "Unknown Product"}</td>
                                                <td>{maxQty}</td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max={maxQty}
                                                        placeholder="0"
                                                        value={reissueSelections[prodId] || ""}
                                                        onChange={(e) => handleReissueChange(prodId, e.target.value, maxQty)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {availableCredit === 0 && returnProducts.length === 0 && (
                        <div className="rc-empty-state">
                            No active return credits or reissue items available.
                        </div>
                    )}
                </div>

                <div className="rc-modal-footer">
                    <button className="rc-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="rc-btn-apply" onClick={handleApply}>Apply Selected Credits</button>
                </div>
            </div>
        </div>
    );
};

export default ReturnCreditsModal;
