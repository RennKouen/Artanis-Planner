// src/data/classes.js
// Referência das 6 classes disponíveis para criação de personagem

export const CLASSES = [
  { id: 'guerreiro',  nome: 'Guerreiro',  cor: '#c0392b', icone: '⚔️' },
  { id: 'arqueiro',   nome: 'Arqueiro',   cor: '#27ae60', icone: '🏹' },
  { id: 'mago',       nome: 'Mago',       cor: '#2980b9', icone: '🔮' },
  { id: 'lutador',    nome: 'Lutador',    cor: '#e67e22', icone: '🥊' },
  { id: 'ladino',     nome: 'Ladino',     cor: '#8e44ad', icone: '🗡️' },
  { id: 'feiticeiro', nome: 'Feiticeiro', cor: '#16a085', icone: '✨' },
];

export function getClasseInfo(id) {
  return CLASSES.find((c) => c.id === id) || CLASSES[0];
}
