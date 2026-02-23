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

// soft Delete category
export const softDeleteCategory = (id, userId) =>
  api.put(`/categories/softDelete?id=${id}&userId=${userId}`);

export const searchCategory = (query) =>
  api.get(`/categories/search?searchKey=${query}`);

export const getPaginatedResults = (page, size, filter) =>
  api.get(`/categories?page=${page}&size=${size}&filter=${filter}`);