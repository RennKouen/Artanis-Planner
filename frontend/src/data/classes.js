// src/data/classes.js
// Referência das 6 classes disponíveis para criação de personagem

export const CLASSES = [
  { id: 'guerreiro',  nome: 'Guerreiro',  cor: '#c0392b', sprite: '/assets/classes/guerreiro.png', icone: '/assets/classes/icones/guerreiro.png' },
  { id: 'arqueiro',   nome: 'Arqueiro',   cor: '#2d8a4e', sprite: '/assets/classes/arqueiro.png', icone: '/assets/classes/icones/arqueiro.png' },
  { id: 'mago',       nome: 'Mago',       cor: '#2d5da8', sprite: '/assets/classes/mago.png', icone: '/assets/classes/icones/mago.png' },
  { id: 'lutador',    nome: 'Lutador',    cor: '#a8532d', sprite: '/assets/classes/lutador.png', icone: '/assets/classes/icones/lutador.png' },
  { id: 'ladino',     nome: 'Ladino',     cor: '#5d3a8a', sprite: '/assets/classes/ladino.png', icone: '/assets/classes/icones/ladino.png' },
  { id: 'feiticeiro', nome: 'Feiticeiro', cor: '#7a1f2b', sprite: '/assets/classes/feiticeiro.png', icone: '/assets/classes/icones/feiticeiro.png' },
];

export function getClasseInfo(id) {
  return CLASSES.find((c) => c.id === id) || CLASSES[0];
}

