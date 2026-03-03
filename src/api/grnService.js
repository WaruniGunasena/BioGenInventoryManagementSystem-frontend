import api from "./axios";

export const createGRN = (formData) =>
    api.post("/grn/create", formData, {
        headers: { "Content-Type": "application/json" },
    });

export const getAllGRNs = () => api.get("/grn/all");

export const getGRNById = (id) => api.get(`/grn/${id}`);

export const searchGRN = (query) => api.get(`/grn/search?searchKey=${query}`);

export const getPaginatedGRNs = (page, size, config = {}) =>
    api.get(`/grn?page=${page}&size=${size}`, config);
