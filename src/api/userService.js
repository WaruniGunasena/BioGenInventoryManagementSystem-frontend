import api from "./axios";

// Get all users
export const getAllUsers = () => api.get("/user/all");

// Get logged-in user
export const getLoggedInUserInfo = () => api.get("/user/current");

// Get user by ID
export const getUserById = (id) => api.get(`/user/${id}`);

// Update user
export const updateUser = (id, data) =>
  api.put(`/user/update/${id}`, data);

// Delete user
export const deleteUser = (id) =>
  api.delete(`/user/delete/${id}`);
