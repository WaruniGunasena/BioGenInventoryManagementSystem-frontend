import React, { createContext, useContext, useState, useCallback } from 'react';
import UserRole from '../enums/UserRole';

// ─── Sections ─────────────────────────────────────────────────────────────────
export const SECTIONS = {
    products: 'Products',
    suppliers: 'Suppliers',
    customers: 'Customers',
    employees: 'Employees',
    categories: 'Categories',
    grn: 'GRN Window',
    stock: 'Stock',
    salesOrders: 'Sales Orders',
};

// ─── Default permissions ───────────────────────────────────────────────────────
// canAdd / canEdit / canDelete per role per section
const buildDefaults = () => {
    const defaults = {};

    Object.keys(SECTIONS).forEach((section) => {
        defaults[section] = {};

        Object.values(UserRole).forEach((role) => {
            // Start everything at false, then grant explicitly below
            defaults[section][role] = { canAdd: false, canEdit: false, canDelete: false };
        });
    });

    const all = { canAdd: true, canEdit: true, canDelete: true };
    const addEdit = { canAdd: true, canEdit: true, canDelete: false };
    const addOnly = { canAdd: true, canEdit: false, canDelete: false };

    // ADMIN — full access everywhere by default (but configurable)
    Object.keys(SECTIONS).forEach((s) => {
        defaults[s][UserRole.ADMIN] = { ...all };
        defaults[s][UserRole.DIRECTOR] = { ...all };
    });

    // INVENTORY_MANAGER
    ['products', 'suppliers', 'categories', 'grn', 'stock'].forEach((s) => {
        defaults[s][UserRole.INVENTORY_MANAGER] = { ...addEdit };
    });
    defaults['grn'][UserRole.INVENTORY_MANAGER] = { ...all };
    defaults['stock'][UserRole.INVENTORY_MANAGER] = { ...all };

    // AREA_MANAGER can view/edit products, stock, categories
    ['products', 'categories', 'stock'].forEach((s) => {
        defaults[s][UserRole.AREA_MANAGER] = { ...addEdit };
    });

    // SALES_REP
    defaults['customers'][UserRole.SALES_REP] = { ...addEdit };
    defaults['salesOrders'][UserRole.SALES_REP] = { ...addOnly };

    return defaults;
};

const STORAGE_KEY = 'biogen_permissions';

const loadFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with current defaults so newly added roles/sections appear
            const defaults = buildDefaults();
            Object.keys(defaults).forEach((section) => {
                if (!parsed[section]) parsed[section] = defaults[section];
                Object.values(UserRole).forEach((role) => {
                    if (!parsed[section][role]) parsed[section][role] = defaults[section][role];
                });
            });
            return parsed;
        }
    } catch (e) { /* ignore */ }
    return buildDefaults();
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState(() => loadFromStorage());

    const updatePermission = useCallback((section, role, action, value) => {
        setPermissions((prev) => {
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [role]: {
                        ...prev[section][role],
                        [action]: value,
                    },
                },
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    /** Returns the permissions object for a specific section */
    const getPermissions = useCallback(
        (section) => permissions[section] ?? {},
        [permissions]
    );

    return (
        <PermissionsContext.Provider value={{ permissions, updatePermission, getPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissionsContext = () => {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error('usePermissionsContext must be used inside PermissionsProvider');
    return ctx;
};
