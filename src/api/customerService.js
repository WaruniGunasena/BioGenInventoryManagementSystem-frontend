import api from "./axios";

export const createCustomer = (data) =>
    api.post("/customers/add", data);

export const getAllCustomers = () =>
    api.get("/customers/getAll");

export const getCustomerById = (id) =>
    api.get(`/customers/${id}`);

export const getPaginatedCustomers = (page, size, filter) =>
    api.get(`/customers/getAllPaginated?page=${page}&size=${size}&filter=${filter}`);

export const updateCustomer = (id, data) =>
    api.put(`/customers/update/${id}`, data);

export const softDeleteCustomer = (customerId, userId) =>
    api.put(`/customers/softDelete?customerId=${customerId}&userId=${userId}`);

export const searchCustomer = (name) =>
    api.get(`/customers/search?name=${name}`);

export const checkCustomerEmailExists = (email) =>
    api.get(`/customers/emailExists?email=${encodeURIComponent(email)}`);

