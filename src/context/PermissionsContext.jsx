import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import UserRole from '../enums/UserRole';
import { getPermissions as fetchPermissionsAPI, savePermissions as savePermissionsAPI } from '../api/permissionService';

// ─── Canonical section keys used everywhere in the frontend ───────────────────
export const SECTIONS = {
    products:    'Products',
    suppliers:   'Suppliers',
    customers:   'Customers',
    employees:   'Employees',
    categories:  'Categories',
    grn:         'GRN Window',
    stock:       'Stock',
    salesOrders: 'Sales Orders',
};

// ─── Backend → Frontend section name aliases ──────────────────────────────────
// Maps any backend section name (any casing) to the canonical frontend key.
// Add more aliases here if the backend adds new section names.
const SECTION_ALIASES = {
    // exact backend names (lowercase comparison)
    'products':     'products',
    'suppliers':    'suppliers',
    'supplier':     'suppliers',
    'customers':    'customers',
    'customer':     'customers',
    'employees':    'employees',
    'employee':     'employees',
    'categories':   'categories',
    'category':     'categories',
    'grn':          'grn',
    'grn window':   'grn',
    'stock':        'stock',
    'salesorders':  'salesOrders',
    'sales_orders': 'salesOrders',
    'sales orders': 'salesOrders',
    // old/alternate backend section names
    'inventory':    'products',      // backend "INVENTORY" maps to products section
};

/** Resolve any backend section name to the canonical frontend key (or null if unknown). */
const resolveSection = (rawKey) => {
    const lower = rawKey.toLowerCase().trim();
    return SECTION_ALIASES[lower] ?? null;
};

// ─── Default permissions (fallback when backend data is missing) ───────────────
// Based on the actual DB data provided by the user.
const buildDefaults = () => {
    const defaults = {};

    // Initialise every section with every role = no permissions
    Object.keys(SECTIONS).forEach((section) => {
        defaults[section] = {};
        Object.values(UserRole).forEach((role) => {
            defaults[section][role] = { canAdd: false, canEdit: false, canDelete: false };
        });
    });

    const all     = { canAdd: true,  canEdit: true,  canDelete: true  };
    const addOnly = { canAdd: true,  canEdit: false, canDelete: false };
    const none    = { canAdd: false, canEdit: false, canDelete: false };

    // ── ADMIN ── full access everywhere
    Object.keys(SECTIONS).forEach((s) => { defaults[s][UserRole.ADMIN] = { ...all }; });

    // ── DIRECTOR ── full access everywhere
    Object.keys(SECTIONS).forEach((s) => { defaults[s][UserRole.DIRECTOR] = { ...all }; });

    // ── INVENTORY_MANAGER ──
    defaults['products'][UserRole.INVENTORY_MANAGER]    = { canAdd: true,  canEdit: false, canDelete: true  }; // row 27
    defaults['suppliers'][UserRole.INVENTORY_MANAGER]   = { canAdd: true,  canEdit: false, canDelete: true  }; // row 22
    defaults['customers'][UserRole.INVENTORY_MANAGER]   = { ...none };                                         // row 18
    defaults['employees'][UserRole.INVENTORY_MANAGER]   = { ...none };                                         // row 40
    defaults['categories'][UserRole.INVENTORY_MANAGER]  = { canAdd: true,  canEdit: false, canDelete: true  }; // row 47
    defaults['grn'][UserRole.INVENTORY_MANAGER]         = { ...all };                                           // row 54
    defaults['stock'][UserRole.INVENTORY_MANAGER]       = { ...all };                                           // row 61
    defaults['salesOrders'][UserRole.INVENTORY_MANAGER] = { ...none };                                         // row 68

    // ── AREA_MANAGER ──
    defaults['products'][UserRole.AREA_MANAGER]         = { canAdd: true,  canEdit: false, canDelete: true  }; // row 28
    defaults['suppliers'][UserRole.AREA_MANAGER]        = { ...none };                                         // row 33
    defaults['customers'][UserRole.AREA_MANAGER]        = { ...none };                                         // row 36
    defaults['employees'][UserRole.AREA_MANAGER]        = { ...none };                                         // row 41
    defaults['categories'][UserRole.AREA_MANAGER]       = { canAdd: true,  canEdit: false, canDelete: true  }; // row 48
    defaults['grn'][UserRole.AREA_MANAGER]              = { ...none };                                         // row 55
    defaults['stock'][UserRole.AREA_MANAGER]            = { canAdd: true,  canEdit: false, canDelete: true  }; // row 62
    defaults['salesOrders'][UserRole.AREA_MANAGER]      = { ...none };                                         // row 69

    // ── SALES_REP ──
    defaults['products'][UserRole.SALES_REP]            = { ...none };                                         // row 31
    defaults['suppliers'][UserRole.SALES_REP]           = { ...none };                                         // (no explicit row, default none)
    defaults['customers'][UserRole.SALES_REP]           = { ...addOnly };                                      // row 20
    defaults['employees'][UserRole.SALES_REP]           = { ...none };                                         // row 44
    defaults['categories'][UserRole.SALES_REP]          = { ...none };                                         // row 51
    defaults['grn'][UserRole.SALES_REP]                 = { ...none };                                         // row 58
    defaults['stock'][UserRole.SALES_REP]               = { ...none };                                         // row 65
    defaults['salesOrders'][UserRole.SALES_REP]         = { canAdd: true,  canEdit: false, canDelete: true  }; // row 72

    // ── CASHIER ──
    defaults['products'][UserRole.CASHIER]              = { ...none };                                         // row 25
    defaults['suppliers'][UserRole.CASHIER]             = { ...none };                                         // row 23
    defaults['customers'][UserRole.CASHIER]             = { ...none };                                         // row 19
    defaults['employees'][UserRole.CASHIER]             = { ...none };                                         // row 38
    defaults['categories'][UserRole.CASHIER]            = { ...none };                                         // row 45
    defaults['grn'][UserRole.CASHIER]                   = { ...none };                                         // row 52
    defaults['stock'][UserRole.CASHIER]                 = { ...none };                                         // row 59
    defaults['salesOrders'][UserRole.CASHIER]           = { ...none };                                         // row 66

    // ── DRIVER ──
    defaults['products'][UserRole.DRIVER]               = { ...none };                                         // row 26
    defaults['suppliers'][UserRole.DRIVER]              = { ...none };                                         // row 32
    defaults['customers'][UserRole.DRIVER]              = { ...none };                                         // row 35
    defaults['employees'][UserRole.DRIVER]              = { ...none };                                         // row 39
    defaults['categories'][UserRole.DRIVER]             = { ...none };                                         // row 46
    defaults['grn'][UserRole.DRIVER]                    = { ...none };                                         // row 53
    defaults['stock'][UserRole.DRIVER]                  = { ...none };                                         // row 60
    defaults['salesOrders'][UserRole.DRIVER]            = { ...none };                                         // row 67

    return defaults;
};

// ─── Transform raw backend matrix ─────────────────────────────────────────────
/**
 * Takes the raw backend permission matrix (which may have mixed-case section
 * names and extra unknown sections) and returns a clean object keyed by the
 * canonical frontend section names.
 *
 * Each role entry is also normalised: values may arrive as 0/1 integers from
 * older API versions, so we coerce them to booleans.
 */
const normalizeBackendMatrix = (raw) => {
    if (!raw || typeof raw !== 'object') return {};

    const result = {};

    Object.entries(raw).forEach(([rawSection, roleMap]) => {
        const canonical = resolveSection(rawSection);
        if (!canonical) return; // unknown section – skip

        if (!result[canonical]) result[canonical] = {};

        if (roleMap && typeof roleMap === 'object') {
            Object.entries(roleMap).forEach(([role, perms]) => {
                if (!perms || typeof perms !== 'object') return;
                // Use the most-permissive entry if the same section/role appears
                // under multiple backend keys (e.g. "CUSTOMERS" and "customers").
                const existing = result[canonical][role];
                const incoming = {
                    canAdd:    Boolean(perms.canAdd    ?? perms.can_add),
                    canEdit:   Boolean(perms.canEdit   ?? perms.can_edit),
                    canDelete: Boolean(perms.canDelete ?? perms.can_delete),
                };
                if (!existing) {
                    result[canonical][role] = incoming;
                } else {
                    // OR-merge: if any source grants a permission, keep it
                    result[canonical][role] = {
                        canAdd:    existing.canAdd    || incoming.canAdd,
                        canEdit:   existing.canEdit   || incoming.canEdit,
                        canDelete: existing.canDelete || incoming.canDelete,
                    };
                }
            });
        }
    });

    return result;
};

/**
 * Merge backend data into defaults.
 * Backend values win wherever they exist; defaults fill in any gaps.
 */
const mergeWithDefaults = (backendMatrix) => {
    const defaults = buildDefaults();
    const normalized = normalizeBackendMatrix(backendMatrix);

    Object.keys(defaults).forEach((section) => {
        if (!normalized[section]) {
            normalized[section] = defaults[section];
        } else {
            Object.values(UserRole).forEach((role) => {
                if (!normalized[section][role]) {
                    normalized[section][role] = defaults[section][role];
                }
            });
        }
    });

    return normalized;
};

// ─── Local-storage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = 'biogen_permissions';
// Bump this version whenever the section-key schema changes.
// A mismatch causes the old cache to be discarded so the backend is re-fetched.
const STORAGE_VERSION = 2;
const STORAGE_VERSION_KEY = 'biogen_permissions_version';

const loadFromStorage = () => {
    try {
        const version = parseInt(localStorage.getItem(STORAGE_VERSION_KEY) ?? '0', 10);
        // If the stored version is outdated, discard the cache
        if (version < STORAGE_VERSION) {
            localStorage.removeItem(STORAGE_KEY);
            return buildDefaults();
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge so newly-added roles/sections appear even from old cache
            return mergeWithDefaults(parsed);
        }
    } catch (e) { /* ignore corrupt cache */ }
    return buildDefaults();
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PermissionsContext = createContext(null);

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState(() => loadFromStorage());
    const [isLoading, setIsLoading] = useState(true);

    // Fetch from backend on mount; backend data always wins over local cache.
    useEffect(() => {
        fetchPermissionsAPI()
            .then((res) => {
                const matrix = mergeWithDefaults(res.data ?? {});
                setPermissions(matrix);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
                localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
            })
            .catch((err) => {
                console.warn('Could not load permissions from backend, using cached/defaults.', err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    /**
     * updatePermission — updates a single cell in the local draft.
     * Only used by the Settings page; full persistence is via saveAllPermissions.
     */
    const updatePermission = useCallback((section, role, action, value) => {
        setPermissions((prev) => {
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [role]: {
                        ...prev[section]?.[role],
                        [action]: value,
                    },
                },
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    /**
     * saveAllPermissions — persists a complete draft to the backend.
     * Returns a Promise so the caller can await / catch it.
     */
    const saveAllPermissions = useCallback(async (matrix) => {
        await savePermissionsAPI(matrix);
        setPermissions(matrix);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
        localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
    }, []);

    /** Returns the permission object for the given canonical section key. */
    const getPermissions = useCallback(
        (section) => permissions[section] ?? {},
        [permissions]
    );

    return (
        <PermissionsContext.Provider value={{ permissions, isLoading, updatePermission, saveAllPermissions, getPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissionsContext = () => {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error('usePermissionsContext must be used inside PermissionsProvider');
    return ctx;
};
