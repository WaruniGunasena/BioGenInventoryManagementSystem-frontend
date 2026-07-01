import api from "./axios";

/**
 * GET /api/permissions
 * Returns: { section: { role: { canAdd, canEdit, canDelete } } }
 */
export const getPermissions = () =>
    api.get("/permissions");

/**
 * PUT /api/permissions
 * Body: { permissions: { section: { role: { canAdd, canEdit, canDelete } } } }
 */
export const savePermissions = (permissionsMatrix) =>
    api.put("/permissions", { permissions: permissionsMatrix });
