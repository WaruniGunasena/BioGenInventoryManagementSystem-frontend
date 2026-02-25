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

// Save / read / clear the temp-password flag
export const saveTempPasswordFlag = (flag) =>
  localStorage.setItem("isTempPassword", String(flag));

export const isTempPassword = () =>
  localStorage.getItem("isTempPassword") === "true";

export const clearTempPasswordFlag = () =>
  localStorage.removeItem("isTempPassword");

// Distinguish forgot-password flow from employee first-login flow
export const saveForgotPasswordFlow = (flag) =>
  localStorage.setItem("isForgotPasswordFlow", String(flag));

export const isForgotPasswordFlow = () =>
  localStorage.getItem("isForgotPasswordFlow") === "true";

export const clearForgotPasswordFlow = () =>
  localStorage.removeItem("isForgotPasswordFlow");

// Clear all auth data (including temp-password flag)
export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("isTempPassword");
  localStorage.removeItem("isForgotPasswordFlow");
};
