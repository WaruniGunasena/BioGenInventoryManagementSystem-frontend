import { getLoggedInUserInfo } from '../../../../api/userService';

/**
 * User Utilities
 *
 * All functions call the `GET /user/current` endpoint and return
 * a specific field from the logged-in user's profile.
 *
 * Usage:
 *   import { getUserId, getUserName, getUserEmail } from '../../components/common/Utils/userUtils/userUtils';
 *
 *   const id    = await getUserId();
 *   const name  = await getUserName();
 *   const email = await getUserEmail();
 */

// ---------------------------------------------------------------------------
// Internal helper — single fetch, normalises the response shape
// ---------------------------------------------------------------------------

/**
 * Fetch the logged-in user's full profile object.
 * Supports both `{ data: { user: {...} } }` and `{ data: {...} }` response shapes.
 *
 * @returns {Promise<Object>} user object
 * @throws {Error} if the request fails or no user is found
 */
export const fetchCurrentUser = async () => {
    const response = await getLoggedInUserInfo();
    const raw = response?.data;

    // Support both { user: {...} } and the object directly
    const user = raw?.user ?? raw;

    if (!user || typeof user !== 'object') {
        throw new Error('userUtils: unable to extract user from response.');
    }

    return user;
};

// ---------------------------------------------------------------------------
// Individual field getters
// ---------------------------------------------------------------------------

/**
 * Returns the logged-in user's ID.
 * Supports both `_id` (MongoDB) and `id` fields.
 *
 * @returns {Promise<string|number>}
 */
export const getUserId = async () => {
    const user = await fetchCurrentUser();
    return user.id;
};

/**
 * Returns the logged-in user's full name.
 *
 * @returns {Promise<string|null>}
 */
export const getUserName = async () => {
    const user = await fetchCurrentUser();
    return user.name ?? null;
};

/**
 * Returns the logged-in user's email address.
 *
 * @returns {Promise<string|null>}
 */
export const getUserEmail = async () => {
    const user = await fetchCurrentUser();
    return user.email ?? null;
};

/**
 * Returns the logged-in user's role (e.g. 'admin', 'user').
 *
 * @returns {Promise<string|null>}
 */
export const getUserRole = async () => {
    const user = await fetchCurrentUser();
    return user.role ?? null;
};

/**
 * Returns the logged-in user's phone number.
 *
 * @returns {Promise<string|null>}
 */
export const getUserPhone = async () => {
    const user = await fetchCurrentUser();
    return user.phone ?? user.phoneNumber ?? null;
};

/**
 * Returns the logged-in user's profile image URL.
 *
 * @returns {Promise<string|null>}
 */
export const getUserProfileImage = async () => {
    const user = await fetchCurrentUser();
    return user.profileImage ?? user.avatar ?? user.picture ?? null;
};

/**
 * Returns the entire logged-in user object.
 * Useful when you need multiple fields at once without multiple API calls.
 *
 * @returns {Promise<Object>}
 */
export const getCurrentUser = fetchCurrentUser;
