import apiClient from './apiClient';

export async function fetchExpenses(filters = {}) {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.search) params.search = filters.search;

  const { data } = await apiClient.get('/expenses', { params });
  return data.data;
}

export async function fetchExpenseById(id) {
  const { data } = await apiClient.get(`/expenses/${id}`);
  return data.data;
}

export async function createExpense(payload) {
  const { data } = await apiClient.post('/expenses', payload);
  return data.data;
}

export async function updateExpense(id, payload) {
  const { data } = await apiClient.put(`/expenses/${id}`, payload);
  return data.data;
}

export async function deleteExpense(id) {
  await apiClient.delete(`/expenses/${id}`);
  return true;
}
