import apiClient from './apiClient';

export async function fetchIncome(filters = {}) {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.search) params.search = filters.search;

  const { data } = await apiClient.get('/income', { params });
  return data.data;
}

export async function fetchIncomeById(id) {
  const { data } = await apiClient.get(`/income/${id}`);
  return data.data;
}

export async function createIncome(payload) {
  const { data } = await apiClient.post('/income', payload);
  return data.data;
}

export async function updateIncome(id, payload) {
  const { data } = await apiClient.put(`/income/${id}`, payload);
  return data.data;
}

export async function deleteIncome(id) {
  await apiClient.delete(`/income/${id}`);
  return true;
}
