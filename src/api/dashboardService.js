import api from "./axios";

/**
 * Fetch all dashboard KPI and chart data.
 * Endpoint: GET /api/dashboard/stats
 */
export const getDashboardStats = () => api.get("/dashboard/stats");
