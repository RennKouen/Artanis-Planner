// routes/monsters.js
// Rotas de leitura do bestiário — publicas para qualquer usuário autenticado

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Calcula os stats derivados usando as mesmas formulas do jogo (MonsterData.cs)
function calcularDerivados(m) {
  const atkBonus = m.atk_bonus_override !== null && m.atk_bonus_override !== undefined
    ? m.atk_bonus_override
    : (m.isBoss ? 0 : Math.floor(0.19 * m.level * m.level + 8.79 * m.level + 35));

  const hpMax = m.isBoss
    ? (100 + m.level * 65) + m.vit * 5
    : (15 + m.level * 5) + m.vit * 5;

  const mpMax = 20 + m.level * 15;

  const atk = m.atk_override !== null && m.atk_override !== undefined
    ? m.atk_override
    : 1 + m.str * 3 + m.dex + m.luk + atkBonus;

  const atkM  = 1 + m.int * 5 + m.luk + Math.floor(atkBonus * 0.35);
  const defF  = 1 + m.vit * 3;
  const defM  = 1 + m.int * 2 + m.vit;
  const precisao = 10 + m.dex * 2 + m.luk;
  const esquiva   = 1 + m.agi * 2 + m.luk;

  const media = (m.str + m.agi + m.int + m.dex + m.vit + m.luk) / 6;
  const bonusCrit = Math.min(0.30, (m.str + m.luk - media * 2) * 0.025);
  const chanceCritico = Math.max(0.05, 0.05 + bonusCrit);

  const fatorRecompensa = m.isBoss ? 2.5 : 1.0;
  const expReward  = Math.floor((15 + m.level * 5) * fatorRecompensa);
  const zenyReward = Math.floor((5 + m.level * 3) * fatorRecompensa);

  return {
    ...m,
    hpMax, mpMax, atk, atkM, defF, defM, precisao, esquiva,
    chanceCritico: Math.round(chanceCritico * 100),
    expReward, zenyReward,
  };
}

function parseJsonSafe(value) {
  if (value == null) return [];
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return []; }
}

// GET /api/monsters — lista todos os monstros
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, game_id AS gameId, name, level, is_boss AS isBoss,
              str_stat AS str, agi_stat AS agi, int_stat AS \`int\`,
              dex_stat AS dex, vit_stat AS vit, luk_stat AS luk,
              element, element_level AS elementLevel, lore, sprite,
              atk_override, atk_bonus_override, drops, areas
       FROM monsters ORDER BY name ASC, level ASC`
    );
    const processados = rows.map((r) => calcularDerivados({
      ...r,
      drops: parseJsonSafe(r.drops),
      areas: parseJsonSafe(r.areas),
    }));
    res.json(processados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar monstros.' });
  }
});

// GET /api/monsters/:id — detalhe de um monstro
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, game_id AS gameId, name, level, is_boss AS isBoss,
              str_stat AS str, agi_stat AS agi, int_stat AS \`int\`,
              dex_stat AS dex, vit_stat AS vit, luk_stat AS luk,
              element, element_level AS elementLevel, lore, sprite,
              atk_override, atk_bonus_override, drops, areas
       FROM monsters WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Monstro não encontrado.' });
    }
    const processado = calcularDerivados({
      ...rows[0],
      drops: parseJsonSafe(rows[0].drops),
      areas: parseJsonSafe(rows[0].areas),
    });
    res.json(processado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar monstro.' });
  }
});

module.exports = router;
