import api from "./axios";

export const getAllStock = () => api.get("/stock/all");

export const getStockById = (id) => api.get(`/stock/${id}`);

export const searchStock = (searchKey, page, size, filter, config = {}) =>
    api.get(`/stock/search?searchKey=${encodeURIComponent(searchKey)}&page=${page}&size=${size}&filter=${filter}`, config);

export const getPaginatedStock = (page, size, filter, config = {}) =>
    api.get(`/stock?page=${page}&size=${size}&filter=${filter}`, config);
