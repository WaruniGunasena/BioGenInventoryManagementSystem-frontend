import api from "./axios";

export const addProduct = (formData) =>
  api.post("/products/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateProduct = (formData) =>
  api.put("/products/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getAllProducts = () => api.get("/products/all");

export const getProductById = (id) => api.get(`/products/${id}`);

export const deleteProduct = (id) => api.delete(`/products/delete/${id}`);
