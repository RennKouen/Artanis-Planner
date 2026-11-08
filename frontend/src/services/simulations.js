// src/services/simulations.js
import api from './api';

export async function simularBatalha(payload) {
  const res = await api.post('/simulations', payload);
  return res.data;
}

export async function carregarRestricoes() {
  const res = await api.get('/simulations/slots');
  return res.data;
}
