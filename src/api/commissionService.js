import api from "./axios";

export const getCommissions = () => {
  return api.get("/commissions/all");
};

export const getMyCommissions = () => {
  return api.get("/commissions/my");
};

export const submitCommissionPayment = (paymentData) => {
  return api.post("/commissions/payment", paymentData);
};

export const getCommissionInvoiceDetails = (invoiceNumber) => {
  return api.get(`/commissions/details/${invoiceNumber}`);
};
