// src/data/derivedStats.js
// Mesmas fórmulas do backend (services/derivedStats.js) — usadas na prévia
// da distribuição de pontos antes de confirmar.

export function calcularDerivados(c) {
  const { str, agi, int, dex, vit, luk } = c;
  return {
    hpMax: c.hp_base + vit * 5,
    mpMax: c.mp_base + int * 5,
    atkFisico: 1 + str * 3 + dex + luk,
    atkDistancia: 1 + dex * 3 + str + luk,
    atkMagico: 1 + int * 3 + luk,
    defFisica: 1 + vit * 3,
    defMagica: 1 + int * 2 + vit,
    esquiva: 1 + agi * 2 + luk,
    precisao: 1 + dex * 2 + luk,
    velocidade: Math.max(5, Math.floor(1 + 5 + Math.sqrt(Math.max(0, agi)) * 3.5)),
    chanceCritico: Math.round((0.10 + Math.floor(luk / 3) * 0.01) * 100) / 100,
    danoCritico: 1.5,
  };
}

// O que cada ponto de atributo adiciona (exibido no tooltip)
export const ATRIBUTOS = [
  {
    id: 'str', rotulo: 'STR', nome: 'Força',
    efeitos: ['+3 ATK físico', '+1 ATK à distância'],
  },
  {
    id: 'agi', rotulo: 'AGI', nome: 'Agilidade',
    efeitos: ['+2 Esquiva', 'Aumenta a Velocidade (retorno decrescente)'],
  },
  {
    id: 'int', rotulo: 'INT', nome: 'Inteligência',
    efeitos: ['+5 MP máximo', '+3 ATK mágico', '+2 DEF mágica'],
  },
  {
    id: 'dex', rotulo: 'DEX', nome: 'Destreza',
    efeitos: ['+3 ATK à distância', '+1 ATK físico', '+2 Precisão'],
  },
  {
    id: 'vit', rotulo: 'VIT', nome: 'Vitalidade',
    efeitos: ['+5 HP máximo', '+3 DEF física', '+1 DEF mágica'],
  },
  {
    id: 'luk', rotulo: 'LUK', nome: 'Sorte',
    efeitos: [
      '+1 ATK físico, à distância e mágico',
      '+1 Esquiva e +1 Precisão',
      '+1% de crítico a cada 3 pontos',
    ],
  },
];
