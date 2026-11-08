// services/monsterStats.js
// Atributos derivados de monstros — mesmas formulas de MonsterData.cs.
// Respeita atk_override / atk_bonus_override (ex.: bonecos de treino).

function calcularMonstro(m) {
  const atkBonus = m.atkBonusOverride != null
    ? m.atkBonusOverride
    : (m.isBoss ? 0 : Math.floor(0.19 * m.level * m.level + 8.79 * m.level + 35));

  const hpMax = m.isBoss
    ? (100 + m.level * 65) + m.vit * 5
    : (15 + m.level * 5) + m.vit * 5;
  const mpMax = 20 + m.level * 15;

  const atk = m.atkOverride != null ? m.atkOverride : 1 + m.str * 3 + m.dex + m.luk + atkBonus;
  const atkM = 1 + m.int * 5 + m.luk + Math.floor(atkBonus * 0.35);
  const defF = 1 + m.vit * 3;
  const defM = 1 + m.int * 2 + m.vit;
  const precisao = 10 + m.dex * 2 + m.luk;
  const esquiva = 1 + m.agi * 2 + m.luk;

  const media = (m.str + m.agi + m.int + m.dex + m.vit + m.luk) / 6;
  const bonusCrit = Math.min(0.30, (m.str + m.luk - media * 2) * 0.025);
  const chanceCritico = Math.max(0.05, 0.05 + bonusCrit);

  const fator = m.isBoss ? 2.5 : 1.0;
  return {
    hpMax, mpMax, atk, atkM, defF, defM, precisao, esquiva, chanceCritico,
    velocidade: Math.max(5, 6 + Math.sqrt(Math.max(0, m.agi)) * 3.5),
    expReward: Math.floor((15 + m.level * 5) * fator),
    zenyReward: Math.floor((5 + m.level * 3) * fator),
  };
}

module.exports = { calcularMonstro };
