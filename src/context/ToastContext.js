import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/**
 * useToast – call this hook inside any component to fire toast messages.
 *
 * const { showToast } = useToast();
 * showToast('success', 'Category added!');
 * showToast('error',   'Something went wrong.');
 * showToast('warning', 'Low stock detected.');
 * showToast('info',    'Data refreshed.');
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
