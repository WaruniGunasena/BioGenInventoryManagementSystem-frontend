import React, { useState, useCallback, useRef } from 'react';
import { ToastContext } from './ToastContext';
import Toast from './Toast';

const DURATION = 3500; // ms — how long before auto-dismiss

let nextId = 1;

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
    }, []);

    /**
     * showToast(type, message)
     *
     * @param {'success' | 'error' | 'warning' | 'info'} type
     * @param {string} message
     */
    const showToast = useCallback((type, message) => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, type, message }]);

        timersRef.current[id] = setTimeout(() => {
            removeToast(id);
        }, DURATION);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Fixed toast container — rendered outside any stacking context */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
