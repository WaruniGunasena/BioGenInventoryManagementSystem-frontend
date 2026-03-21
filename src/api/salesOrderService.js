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

export const softDeleteSalesOrder = (salesOrderID, userId) =>
    api.delete(`/sales-orders/softDelete?salesOrderID=${salesOrderID}&userId=${userId}`);

export const updateSalesOrder = (salesOrderID, userID, body) =>
    api.put(`/sales-orders/update?salesOrderID=${salesOrderID}&userID=${userID}`, body, {
        headers: { "Content-Type": "application/json" }
    });

export const approveSalesOrder = (salesOrderStatus, userId, salesOrderId) =>
    api.post(`/sales-orders/Approval?userId=${userId}&salesOrderStatus=${salesOrderStatus}&salesOrderId=${salesOrderId}`);

export const getPendingOrderCount = () => api.get("/sales-orders/getPendingOrderCount");
