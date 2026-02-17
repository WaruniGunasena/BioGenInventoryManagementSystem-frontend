import api from "./axios";
import { saveToken, saveRole, clearAuth } from "../auth/tokenService";

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  saveToken(res.data.token);
  saveRole(res.data.role);
  return res.data;
};

export const registerUser = (data) => api.post("/auth/register", data);

export const logout = async () => {
  await api.post("/auth/logout");
  clearAuth();
};
