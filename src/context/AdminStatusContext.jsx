import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAdminExists } from '../api/authService';

const AdminStatusContext = createContext();

export const AdminStatusProvider = ({ children }) => {
    const [adminExists, setAdminExists] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshAdminStatus = async () => {
        setLoading(true);
        try {
            const res = await checkAdminExists();
            setAdminExists(res.data === true);
        } catch (error) {
            console.error("Error checking admin existence:", error);
            // Default to true on error to avoid locking the app or showing register page incorrectly
            setAdminExists(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAdminStatus();
    }, []);

    return (
        <AdminStatusContext.Provider value={{ adminExists, loading, refreshAdminStatus }}>
            {children}
        </AdminStatusContext.Provider>
    );
};

export const useAdminStatus = () => {
    const context = useContext(AdminStatusContext);
    if (context === undefined) {
        throw new Error('useAdminStatus must be used within an AdminStatusProvider');
    }
    return context;
};
