// src/services/items.js
import api from './api';

export async function listarItens(params = {}) {
  const res = await api.get('/items', { params });
  return res.data;
}
