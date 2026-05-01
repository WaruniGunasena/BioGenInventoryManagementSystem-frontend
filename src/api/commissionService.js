import api from "./axios";

export const getPaginatedCommissions = (page, size) => {
  return api.get(`/commissions?page=${page}&size=${size}`);
};  

export const getPaginatedMyCommissions = (page, size) => {
  return api.get(`/commissions/my?page=${page}&size=${size}`);
};

export const getPaginatedCommissionsHistory = (userId, page, size) => {
  return api.get(`/commissions/history/${userId}?page=${page}&size=${size}`);
};

export const submitCommissionPayment = (paymentData) => {
  return api.post("/commissions/payment", paymentData);
};

export const getCommissionInvoiceDetails = (invoiceNumber) => {
  return api.get(`/commissions/details/${invoiceNumber}`);
};

export const getPaginatedMyCommissionReversals = (page, size) => {
  return api.get(`/commissions/my-reversals?page=${page}&size=${size}`);
};


