// src/data/elements.js
// Cores associadas a cada elemento do jogo, usadas no Bestiário

export const ELEMENT_COLORS = {
  neutro:  '#9aa0ac', // cinza
  agua:    '#5cc9f5', // azul claro
  fogo:    '#e0503a', // vermelho
  terra:   '#a9743f', // marrom
  vento:   '#5fbf5f', // verde
  sagrado: '#dcb51f', // amarelo/dourado
  sombrio: '#9a5fd1', // roxo
};

export function getElementColor(element) {
  return ELEMENT_COLORS[element] || ELEMENT_COLORS.neutro;
}
