import api from "./axios";

export const createSalesOrder = (formData) =>
    api.post("/sales-orders/create", formData, {
        headers: { "Content-Type": "application/json" },
    });

export const getAllSalesOrders = () => api.get("/sales-orders/all");

export const getSalesOrderById = (id) => api.get(`/sales-orders/${id}`);

export const searchSalesOrder = (query) => api.get(`/sales-orders/search?searchKey=${query}`);

export const getPaginatedSalesOrders = (page, size, config = {}) =>
    api.get(`/sales-orders?page=${page}&size=${size}`, config);
