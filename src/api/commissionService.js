import api from "./axios";

export const getCommissions = () => {
  return api.get("/commissions");
};

export const getMyCommissions = () => {
  return api.get("/commissions/my");
};
