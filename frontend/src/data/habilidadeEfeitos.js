// src/data/habilidadeEfeitos.js
// Efeitos por nível de habilidades passivas, quando o banco do jogo não traz valores numéricos.
// Fonte: descrição da própria habilidade ("cada nível aumenta ... em 2%").

export const EFEITOS_PASSIVOS = {
  recuperacao_hp_pos_batalha: (nivel) => [['Recuperação de HP pós-batalha', `${2 * nivel}% do HP máx.`]],
  recuperacao_mp_pos_batalha: (nivel) => [['Recuperação de MP pós-batalha', `${2 * nivel}% do MP máx.`]],
};
