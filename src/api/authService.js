import api from "./axios";
import { saveToken, saveRole, clearAuth, saveTempPasswordFlag } from "../auth/tokenService";
import { clearUserCache } from "../components/common/Utils/userUtils/userUtils";

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  saveToken(res.data.token);
  saveRole(res.data.role);
  saveTempPasswordFlag(res.data.isTempPassword ?? false);
  return res.data;
};

export const registerUser = (data) => api.post("/auth/register", data);

export const checkAdminExists = () => api.get("/auth/AdminExists");

export const logout = async () => {
  await api.post("/auth/logout");
  clearAuth();
  clearUserCache(); // clear cached user so next login fetches fresh data
};
