import { usePermissionsContext } from '../context/PermissionsContext';
import { getRole } from '../auth/tokenService';

/**
 * usePermissions(section)
 *
 * Returns the add/edit/delete permissions for the currently logged-in user
 * in the given section.
 *
 * Usage:
 *   const { canAdd, canEdit, canDelete } = usePermissions('products');
 */
const usePermissions = (section) => {
    const { getPermissions } = usePermissionsContext();
    const role = getRole(); // reads from localStorage

    if (!role) return { canAdd: false, canEdit: false, canDelete: false };

    const sectionPerms = getPermissions(section);
    const rolePerms = sectionPerms[role];

    if (!rolePerms) return { canAdd: false, canEdit: false, canDelete: false };

    return {
        canAdd: !!rolePerms.canAdd,
        canEdit: !!rolePerms.canEdit,
        canDelete: !!rolePerms.canDelete,
    };
};

export default usePermissions;
