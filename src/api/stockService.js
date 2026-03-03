import api from "./axios";

export const getAllStock = () => api.get("/stock/all");

export const getStockById = (id) => api.get(`/stock/${id}`);


export const searchStock = (query, config = {}) => api.get(`/stock/search?searchKey=${query}`, config);

export const getPaginatedStock = (page, size, filter, config = {}) => api.get(`/stock?page=${page}&size=${size}&filter=${filter}`, config);
