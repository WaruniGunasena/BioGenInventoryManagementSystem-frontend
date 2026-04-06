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
    api.post("/product-returns/create", data, {
        headers: { "Content-Type": "application/json" },
    });

/**
 * Fetch all product returns (for listing/history page).
 * Backend: GET /product-returns/all
 */
export const getAllProductReturns = () =>
    api.get("/product-returns/all");
