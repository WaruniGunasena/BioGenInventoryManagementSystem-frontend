// Save access token
export const saveToken = (token) => {
  localStorage.setItem("access_token", token);
};

// Get access token
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// Save user role
export const saveRole = (role) => {
  localStorage.setItem("role", role);
};

// Get user role
export const getRole = () => {
  return localStorage.getItem("role");
};

// Clear all auth data
export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
};
