import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './Common.css';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    icon: Icon = AlertTriangle // Default icon
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="confirmation-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="confirmation-icon-wrapper">
                    <Icon className="confirmation-icon" size={48} />
                </div>

                {title && <h3 className="confirmation-title">{title}</h3>}

                <p className="confirmation-message">{message}</p>

                <div className="confirmation-buttons">
                    <button className="confirm-btn-primary" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                    <button className="confirm-btn-secondary" onClick={onClose}>
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
