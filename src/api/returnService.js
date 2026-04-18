import api from "./axios";

/**
 * Fetch all sales orders (invoices) for a specific customer.
 * Backend: GET /sales-orders/customer/{id}
 */
export const getSalesOrdersByCustomer = (customerId) =>
    api.get(`/sales-orders/customer/${customerId}`);


/**
 * Submit a product return.
 * Backend: POST /product-returns/create  (to be implemented on the backend)
 */
export const createProductReturn = (data) =>
    api.post("/returns/process", data, {
        headers: { "Content-Type": "application/json" },
    });

/**
 * Fetch all product returns (for listing/history page) with pagination.
 * Backend: GET /api/returns/allReturns/{page}/{size}
 */
export const getAllReturns = (page = 0, size = 8) =>
    api.get(`/returns/allReturns?page=${page}&size=${size}`);

/**
 * Fetch product return by ID.
 * Backend: GET /api/returns/{id}
 */
export const getReturnById = (id) =>
    api.get(`/returns/${id}`);

/**
 * Fetch customer return summary (Pending cash credit & reissue items)
 * Backend: GET /api/returns/{customerId}
 */
export const getCustomerReturnSummary = (customerId) =>
    api.get(`/returns/customer/${customerId}`);

