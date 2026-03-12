import api from "./axios";

export const addSupplier = (data) => api.post("/suppliers/add", data);
export const getAllSuppliers = () => api.get("/suppliers/all");
export const getSupplierById = (id) => api.get(`/suppliers/${id}`);
export const updateSupplier = (id, data) => api.put(`/suppliers/update/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/delete/${id}`);

export const softDeleteSupplier = (id, userId) =>
  api.put(`/suppliers/softDelete?id=${id}&userId=${userId}`);

export const searchSupplier = (query) => api.get(`/suppliers/search?searchKey=${query}`);

export const getPaginatedSupplierResults = (page, size, filter) =>
  api.get(`/suppliers?page=${page}&size=${size}&filter=${filter}`);
