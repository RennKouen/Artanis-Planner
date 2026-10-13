// src/services/api.js
// Instância central do axios — injeta o token JWT automaticamente
// e desloga o usuário quando o token é recusado pelo servidor.

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('artanis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // 401 fora das rotas de login/registro = sessão inválida ou expirada
    if (status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('artanis_token');
      localStorage.removeItem('artanis_player');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
