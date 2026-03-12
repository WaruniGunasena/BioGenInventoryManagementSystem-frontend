import api from "./axios";

// Register a new employee — backend sends OTP invite email automatically
export const inviteEmployee = (data) => api.post("/user/registerEmp", data);

// Get all employees / users
export const getAllEmployees = () => api.get("/user/all");

// Get employee by ID
export const getEmployeeById = (id) => api.get(`/user/${id}`);

// Update employee
export const updateEmployee = (id, data) => api.put(`/user/update/${id}`, data);

// Delete employee
export const deleteEmployee = (id) => api.delete(`/user/delete/${id}`);

// soft Delete employee
export const softDeleteEmployee = (id, userId) =>
    api.put(`/user/softDelete?id=${id}&userId=${userId}`);

// Search employees
export const searchEmployee = (query) => api.get(`/user/search?searchKey=${query}`);

export const getPaginatedEmployeeResults = (page, size, filter) =>
    api.get(`/user?page=${page}&size=${size}&filter=${filter}`);

