import { getLoggedInUserInfo } from '../../../../api/userService';

// ---------------------------------------------------------------------------
// Module-level cache — one HTTP call for the entire session
// ---------------------------------------------------------------------------
let _userCache = null; // stores the resolved user object
let _userPromise = null; // stores the in-flight promise (deduplicates concurrent calls)

/**
 * Clear the user cache — call this on logout so the next login
 * fetches fresh data.
 */
export const clearUserCache = () => {
    _userCache = null;
    _userPromise = null;
};

/**
 * Fetch the logged-in user's full profile object.
 * Results are cached in memory — only one HTTP request is ever made
 * per session regardless of how many components call this.
 */
export const fetchCurrentUser = async () => {
    // Return cached object immediately
    if (_userCache) return _userCache;

    // Deduplicate concurrent calls — reuse the same in-flight promise
    if (!_userPromise) {
        _userPromise = getLoggedInUserInfo().then((response) => {
            const raw = response?.data;
            const user = raw?.user ?? raw;
            if (!user || typeof user !== 'object') {
                throw new Error('userUtils: unable to extract user from response.');
            }
            _userCache = user;
            return user;
        }).catch((err) => {
            // Clear promise on error so next call retries
            _userPromise = null;
            throw err;
        });
    }

    return _userPromise;
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
