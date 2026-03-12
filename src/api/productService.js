import api from "./axios";

export const addProduct = (formData) =>
  api.post("/products/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateProduct = (id, formData) =>
  api.put(`/products/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAllProducts = () => api.get("/products/all");

export const getProductById = (id) => api.get(`/products/${id}`);

export const deleteProduct = (id) => api.delete(`/products/delete/${id}`);

export const softDeleteProduct = (id, userId) =>
  api.put(`/products/softDelete?id=${id}&userId=${userId}`);

export const searchProduct = (query) => api.get(`/products/search?searchKey=${query}`);

export const getPaginatedProductResults = (page, size, filter) =>
  api.get(`/products?page=${page}&size=${size}&filter=${filter}`);
