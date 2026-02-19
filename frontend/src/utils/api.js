import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getSummary: () => api.get('/transactions/summary'),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const snapshotAPI = {
  getAll: () => api.get('/snapshots'),
  cut: (data) => api.post('/snapshots/cut', data),
  delete: (id) => api.delete(`/snapshots/${id}`),
};

export const memberAPI = {
  getAll: () => api.get('/members'),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  resetPeriod: (startDate) => api.post('/settings/reset-period', { startDate }),
};

export default api;
