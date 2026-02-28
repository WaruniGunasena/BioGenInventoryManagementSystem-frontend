import React, { useState, useCallback } from 'react';
import './Toast.css';

const ICONS = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
};

const DURATION = 3500; // ms

const Toast = ({ toast, onRemove }) => {
    const [hiding, setHiding] = useState(false);

    const handleClose = useCallback(() => {
        setHiding(true);
        setTimeout(() => onRemove(toast.id), 280);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`toast toast-${toast.type} ${hiding ? 'toast-hiding' : ''}`}
            style={{ '--toast-duration': `${DURATION}ms` }}
        >
            <span className="toast-icon">{ICONS[toast.type] ?? 'i'}</span>

            <div className="toast-body">
                <span className="toast-title">{toast.type}</span>
                <span className="toast-message">{toast.message}</span>
            </div>

            <button className="toast-close" onClick={handleClose} aria-label="Close">✕</button>

            <div className="toast-progress" />
        </div>
    );
};

export default Toast;
