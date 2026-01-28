import axios from 'axios';

// Remove the baseURL - proxy will handle it
const api = axios.create({
  baseURL: '/api',  // Changed from 'http://localhost:3000/api'
  headers: {
    'Content-Type': 'application/json'
  }
});

export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export default api;