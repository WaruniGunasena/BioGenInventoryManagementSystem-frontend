import api from "./axios";

// Create customer
export const createCustomer = (data) =>
    api.post("/customers/add", data);

// Get all customers (no pagination)
export const getAllCustomers = () =>
    api.get("/customers/getAll");

// Get customer by ID
export const getCustomerById = (id) =>
    api.get(`/customers/${id}`);

// Get paginated + sorted customers
// filter: 'ASC' | 'DESC'
export const getPaginatedCustomers = (page, size, filter) =>
    api.get(`/customers/getAllPaginated?page=${page}&size=${size}&filter=${filter}`);

// Update customer
export const updateCustomer = (id, data) =>
    api.put(`/customers/update/${id}`, data);

// Soft delete customer
export const softDeleteCustomer = (customerId, userId) =>
    api.put(`/customers/softDelete?customerId=${customerId}&userId=${userId}`);

// Search customer by name
export const searchCustomer = (name) =>
    api.get(`/customers/search?name=${name}`);

// Check if a customer email already exists
export const checkCustomerEmailExists = (email) =>
    api.get(`/customers/emailExists?email=${encodeURIComponent(email)}`);

