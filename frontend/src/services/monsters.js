// src/services/monsters.js
import api from './api';

export async function listarMonstros() {
  const res = await api.get('/monsters');
  return res.data;
}

export async function buscarMonstro(id) {
  const res = await api.get(`/monsters/${id}`);
  return res.data;
}
