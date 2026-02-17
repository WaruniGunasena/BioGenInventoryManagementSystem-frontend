import api from "./axios";

// Create category
export const createCategory = (data) =>
  api.post("/categories/add", data);

// Get all categories
export const getAllCategory = () =>
  api.get("/categories/all");

// Get category by ID
export const getCategoryById = (id) =>
  api.get(`/categories/${id}`);

// Update category
export const updateCategory = (id, data) =>
  api.put(`/categories/update/${id}`, data);

// Delete category
export const deleteCategory = (id) =>
  api.delete(`/categories/delete/${id}`);
