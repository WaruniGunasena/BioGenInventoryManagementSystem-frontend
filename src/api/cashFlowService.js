import api from "./axios";

export const getPendingCashFlow = async (startDate, endDate) => {
  return await api.get('/cashflow/pending', {
    params: { startDate, endDate }
  });
};

export const getCompletedCashFlow = async (startDate, endDate) => {
  return await api.get('/cashflow/completed', {
    params: { startDate, endDate }
  });
};

export const getCashFlowSummary = async (startDate, endDate) => {
  return await api.get('/cashflow/summary', {
    params: { startDate, endDate }
  });
};
