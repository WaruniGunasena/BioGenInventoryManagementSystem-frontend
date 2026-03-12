import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, Save, RotateCcw, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Sidebar';
import { usePermissionsContext, SECTIONS } from '../../context/PermissionsContext';
import UserRole from '../../enums/UserRole';
import { getRole } from '../../auth/tokenService';
import './Settings.css';

// Roles that are allowed to EDIT the permissions table
const CAN_EDIT_SETTINGS = [UserRole.ADMIN, UserRole.INVENTORY_MANAGER];

// Human-friendly role labels
const ROLE_LABELS = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.INVENTORY_MANAGER]: 'Inventory Manager',
    [UserRole.AREA_MANAGER]: 'Area Manager',
    [UserRole.DIRECTOR]: 'Director',
    [UserRole.SALES_REP]: 'Sales Rep',
    [UserRole.CASHIER]: 'Cashier',
    [UserRole.DRIVER]: 'Driver',
};

const ACTIONS = [
    { key: 'canAdd', label: 'Add', type: 'add' },
    { key: 'canEdit', label: 'Edit', type: 'edit' },
    { key: 'canDelete', label: 'Delete', type: 'delete' },
];

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const Settings = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(Object.values(UserRole)[0]);
    const [savedToast, setSavedToast] = useState(false);

    const { permissions, updatePermission } = usePermissionsContext();
    const currentRole = getRole();
    const canEdit = CAN_EDIT_SETTINGS.includes(currentRole);

    // Local draft — changes stay here until Save is clicked
    const [draft, setDraft] = useState(() => deepClone(permissions));
    const [hasChanges, setHasChanges] = useState(false);

    // Sync draft on first mount
    useEffect(() => {
        setDraft(deepClone(permissions));
        setHasChanges(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggle = (section, action, currentValue) => {
        if (!canEdit) return;
        setDraft((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [selectedRole]: {
                    ...prev[section][selectedRole],
                    [action]: !currentValue,
                },
            },
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        Object.keys(SECTIONS).forEach((section) => {
            Object.values(UserRole).forEach((role) => {
                ACTIONS.forEach(({ key }) => {
                    updatePermission(section, role, key, draft[section]?.[role]?.[key] ?? false);
                });
            });
        });
        setHasChanges(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
    };

    const handleDiscard = () => {
        setDraft(deepClone(permissions));
        setHasChanges(false);
    };

    return (
        <Layout>
            <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isMobileOpen={isMobileSidebarOpen}
                    toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />

                <div className="dashboard-content settings-page">
                    {/* Header */}
                    <div className="settings-header">
                        <div className="settings-header-icon">
                            <ShieldCheck size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2>Permissions Settings</h2>
                            <p>Control what each role can add, edit, or delete in each section</p>
                        </div>

                        {/* Save / Discard buttons — visible to editors only */}
                        {canEdit && (
                            <div className="settings-header-actions">
                                {hasChanges && (
                                    <button className="settings-btn-discard" onClick={handleDiscard}>
                                        <RotateCcw size={15} /> Discard
                                    </button>
                                )}
                                <button
                                    className={`settings-btn-save ${hasChanges ? 'active' : ''}`}
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                >
                                    <Save size={15} />
                                    {hasChanges ? 'Save Changes' : 'Saved'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Success toast */}
                    {savedToast && (
                        <div className="settings-saved-toast">
                            <CheckCircle size={16} /> Permissions saved successfully!
                        </div>
                    )}

                    {/* Read-only banner */}
                    {!canEdit && (
                        <div className="settings-readonly-banner">
                            <Info size={16} />
                            <span>You are viewing permissions in read-only mode. Contact an Admin or Inventory Manager to make changes.</span>
                        </div>
                    )}

                    {/* Role tabs */}
                    <div className="settings-role-tabs">
                        {Object.values(UserRole).map((role) => (
                            <button
                                key={role}
                                className={`settings-role-tab ${selectedRole === role ? 'active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                            >
                                {ROLE_LABELS[role] ?? role}
                            </button>
                        ))}
                    </div>

                    {/* Permissions table */}
                    <div className="settings-table-wrapper">
                        <table className="settings-table">
                            <thead>
                                <tr>
                                    <th className="col-section">Section</th>
                                    <th className="col-action col-add">
                                        <span className="action-th add">Add</span>
                                    </th>
                                    <th className="col-action col-edit">
                                        <span className="action-th edit">Edit</span>
                                    </th>
                                    <th className="col-action col-delete">
                                        <span className="action-th delete">Delete</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(SECTIONS).map(([sectionKey, sectionLabel]) => {
                                    const rolePerms = draft[sectionKey]?.[selectedRole] ?? {};
                                    return (
                                        <tr key={sectionKey}>
                                            <td className="col-section">
                                                <div className="section-label">{sectionLabel}</div>
                                            </td>
                                            {ACTIONS.map(({ key, type }) => (
                                                <td key={key} className={`col-action col-${type}`}>
                                                    <label className={`toggle-switch ${type} ${!canEdit ? 'disabled' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!rolePerms[key]}
                                                            onChange={() => handleToggle(sectionKey, key, rolePerms[key])}
                                                            disabled={!canEdit}
                                                        />
                                                        <span className="toggle-slider" />
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
