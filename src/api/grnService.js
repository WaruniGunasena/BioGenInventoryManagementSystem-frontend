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

export const updateGRN = (id, data) => api.put(`/grn/update/${id}`, data);

export const softDeleteGRN = (id, userId) =>
    api.put(`/grn/softDelete?id=${id}&userId=${userId}`);

export const submitGRNPayment = (paymentData) => 
    api.post('/grn/payment', paymentData, {
        headers: { "Content-Type": "application/json" },
    });
