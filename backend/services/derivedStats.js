// services/derivedStats.js
// Fórmulas de atributos derivados e progressão do personagem.
// Mesmas fórmulas do jogo (PlayerData.cs). Valores base de ataque/defesa/esquiva/precisão/velocidade = 1.

const NIVEL_MAXIMO = 40;
const PONTOS_POR_NIVEL = 3;
const HP_POR_NIVEL = 5;
const MP_POR_NIVEL = 2;

const BASE = { atk: 1, def: 1, esquiva: 1, precisao: 1, velocidade: 1 };
const CRITICO_BASE = 0.10;
const DANO_CRITICO = 1.5;

function expParaProximoNivel(level) {
  if (level >= NIVEL_MAXIMO) return 0;
  return Math.floor(60 * Math.pow(level, 1.4));
}

function calcularDerivados(c) {
  const str = c.str_base, agi = c.agi_base, int = c.int_base;
  const dex = c.dex_base, vit = c.vit_base, luk = c.luk_base;

  return {
    hpMax: c.hp_base + vit * 5,
    mpMax: c.mp_base + int * 5,
    atkFisico: BASE.atk + str * 3 + dex + luk,
    atkDistancia: BASE.atk + dex * 3 + str + luk,
    atkMagico: BASE.atk + int * 3 + luk,
    defFisica: BASE.def + vit * 3,
    defMagica: BASE.def + int * 2 + vit,
    esquiva: BASE.esquiva + agi * 2 + luk,
    precisao: BASE.precisao + dex * 2 + luk,
    velocidade: Math.max(5, Math.floor(BASE.velocidade + 5 + Math.sqrt(Math.max(0, agi)) * 3.5)),
    chanceCritico: Math.round((CRITICO_BASE + Math.floor(luk / 3) * 0.01) * 100) / 100,
    danoCritico: DANO_CRITICO,
  };
}

// Valores de progressao para um nivel (definido diretamente).
// Nivel 1: 100 HP, 100 MP, 5 pontos de atributo, 1 ponto de habilidade.
// Cada nivel adicional: +5 HP, +2 MP, +3 pontos de atributo, +1 ponto de habilidade.
function progressaoDoNivel(level) {
  return {
    hp_base: 100 + HP_POR_NIVEL * (level - 1),
    mp_base: 100 + MP_POR_NIVEL * (level - 1),
    pontosTotais: 5 + PONTOS_POR_NIVEL * (level - 1),
    pontosHabilidadeTotais: level,
  };
}

function pontosGastosEmAtributos(c) {
  return (
    (c.str_base - 3) + (c.agi_base - 3) + (c.int_base - 3) +
    (c.dex_base - 3) + (c.vit_base - 3) + (c.luk_base - 3)
  );
}

const CLASSE_NO_JOGO = {
  guerreiro: 'warrior', arqueiro: 'archer', mago: 'magician',
  lutador: 'fighter', ladino: 'rogue', feiticeiro: 'sorcerer',
};

function montarFicha(c) {
  return {
    ...c,
    derivados: calcularDerivados(c),
    expProximoNivel: expParaProximoNivel(c.level),
    nivelMaximo: NIVEL_MAXIMO,
  };
}

module.exports = {
  NIVEL_MAXIMO, PONTOS_POR_NIVEL, HP_POR_NIVEL, MP_POR_NIVEL,
  expParaProximoNivel, calcularDerivados, progressaoDoNivel, pontosGastosEmAtributos,
  CLASSE_NO_JOGO, montarFicha,
};
