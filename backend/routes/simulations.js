// routes/simulations.js
// Simulação de batalha: personagem (com arma opcional) vs monstro do bestiário

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { calcularDerivados } = require('../services/derivedStats');
const { calcularMonstro } = require('../services/monsterStats');
const { simularBatalha, simularVarias } = require('../services/combate');

router.use(authMiddleware);

// GET /api/simulations/slots — restrições de equipamento por classe (usadas pelo front)
router.get('/slots', (req, res) => res.json({ classes: SLOTS_POR_CLASSE, duasMaos: ARMAS_DUAS_MAOS }));

const ELEMENTO_ALIAS = { gelo: 'agua' }; // o elemento gelo não existe no jogo

const { SLOTS_POR_CLASSE, ARMAS_DUAS_MAOS, slotsDaClasse } = require('../data/slotsPorClasse');

// Slots equipáveis (iguais ao EquippedItems do jogo; luvas é um slot de armadura por subcategoria)
const SLOTS = {
  maoPrincipal: { type: 'armas' },
  maoSecundaria: { type: 'armas' },
  armadura: { type: 'armaduras', prefixo: 'armadura' },
  elmo: { type: 'armaduras', prefixo: 'elmo' },
  botas: { type: 'armaduras', prefixo: 'botas' },
  luvas: { type: 'armaduras', prefixo: 'luvas' },
  acessorio1: { type: 'acessorios' },
  acessorio2: { type: 'acessorios' },
};

// Devolve null se o item serve, ou o motivo da recusa
function motivoInvalido(slot, item, classe) {
  const c = SLOTS[slot];
  const cfg = slotsDaClasse(classe);
  if (item.type !== c.type) return 'tipo de item incorreto';
  const sub = item.subcategory;
  if (slot === 'maoPrincipal' && !cfg.maoPrincipal.includes(sub)) return `a classe ${classe} não usa ${sub} na mão primária`;
  if (slot === 'maoSecundaria' && !cfg.maoSecundaria.includes(sub)) return `a classe ${classe} não usa ${sub} na mão secundária`;
  if (c.prefixo && (!sub.startsWith(c.prefixo) || !cfg.armaduras.includes(sub))) return `a classe ${classe} não pode usar ${sub}`;
  return null;
}

const SOMA = ['str', 'agi', 'int', 'dex', 'vit', 'luk'];

// equip: { slot: item|null }
function montarJogador(personagem, equip) {
  const itens = Object.entries(equip).filter(([, it]) => it);
  const soma = (k, filtro) =>
    itens.reduce((t, [slot, it]) => (filtro && !filtro(slot, it) ? t : t + ((it.attributes || {})[k] || 0)), 0);
  const main = equip.maoPrincipal;
  const w = main ? main.attributes || {} : {};
  // ataque: arma principal, mão secundária ofensiva (aljava, tomo, orb, adaga, soqueira, tonfa), armaduras e acessórios; escudo só defende
  const contaAtk = (slot, it) => !(slot === 'maoSecundaria' && it.subcategory === 'escudo');

  const com = (k) => personagem[`${k}_base`] + soma(k);
  const derivados = calcularDerivados({
    ...personagem,
    str_base: com('str'), agi_base: com('agi'), int_base: com('int'),
    dex_base: com('dex'), vit_base: com('vit'), luk_base: com('luk'),
  });
  const elemento = ELEMENTO_ALIAS[w.elemento_atk] || w.elemento_atk || 'neutro';
  const usaDistancia = !!main && ['arco', 'besta'].includes(main.subcategory);
  const atkF = soma('atk_f', contaAtk), atkR = soma('atk_r', contaAtk), atkM = soma('atk_m', contaAtk);

  // elemento da armadura: maior nível entre as peças (como GetPlayerArmorElement)
  let elementoDef = 'neutro', nivelDef = 0;
  for (const [, it] of itens) {
    const a = it.attributes || {};
    if (a.elemento_def && (a.nivel_elemento_def || 1) > nivelDef) {
      elementoDef = ELEMENTO_ALIAS[a.elemento_def] || a.elemento_def;
      nivelDef = a.nivel_elemento_def || 1;
    }
  }
  return {
    nome: personagem.name,
    hpMax: derivados.hpMax,
    mpMax: derivados.mpMax,
    atkF: derivados.atkFisico + atkF,
    atkR: derivados.atkDistancia + atkR,
    atkM: derivados.atkMagico + atkM,
    bonusArma: { fisico: atkF, distancia: atkR, magico: atkM },
    defF: derivados.defFisica + soma('def_f'),
    defM: derivados.defMagica + soma('def_m'),
    precisao: derivados.precisao + soma('precisao'),
    esquiva: derivados.esquiva + soma('esquiva'),
    velocidade: derivados.velocidade,
    chanceCritico: derivados.chanceCritico + soma('chance_critico'),
    danoCritico: derivados.danoCritico,
    usaDistancia,
    elementoAtk: elemento,
    elementoDef, nivelElementoDef: nivelDef || null,
  };
}

// POST /api/simulations
// body: { characterId, monsterId, weaponId?, strategy: 'basico'|'habilidades', runs?: 1..1000 }
router.post('/', async (req, res) => {
  try {
    const { characterId, monsterId, weaponId, strategy = 'basico' } = req.body;
    const pedido = { ...(req.body.equip || {}) };
    if (weaponId && !pedido.maoPrincipal) pedido.maoPrincipal = weaponId;
    const runs = Math.min(1000, Math.max(1, parseInt(req.body.runs, 10) || 1));
    if (!['basico', 'habilidades'].includes(strategy)) {
      return res.status(400).json({ error: 'Estratégia inválida.' });
    }

    const [chars] = await pool.query(
      'SELECT * FROM characters WHERE id = ? AND player_id = ?',
      [characterId, req.playerId]
    );
    if (chars.length === 0) return res.status(404).json({ error: 'Personagem não encontrado.' });
    const personagem = chars[0];

    const [mons] = await pool.query(
      `SELECT id, name, level, is_boss AS isBoss,
              str_stat AS str, agi_stat AS agi, int_stat AS \`int\`,
              dex_stat AS dex, vit_stat AS vit, luk_stat AS luk,
              element, element_level AS elementLevel,
              atk_override AS atkOverride, atk_bonus_override AS atkBonusOverride
         FROM monsters WHERE id = ?`,
      [monsterId]
    );
    if (mons.length === 0) return res.status(404).json({ error: 'Monstro não encontrado.' });
    const m = mons[0];
    const dm = calcularMonstro(m);

    const equip = {};
    for (const slot of Object.keys(SLOTS)) {
      if (!pedido[slot]) { equip[slot] = null; continue; }
      const [rows] = await pool.query(
        'SELECT id, name, type, subcategory, attributes FROM items WHERE id = ?', [pedido[slot]]);
      const motivo = rows.length === 0 ? 'item não encontrado' : motivoInvalido(slot, rows[0], personagem.class);
      if (motivo) return res.status(400).json({ error: `Item inválido (${slot}): ${motivo}.` });
      equip[slot] = rows[0];
    }

    let habilidades = [];
    if (strategy === 'habilidades') {
      const [rows] = await pool.query(
        `SELECT a.name, a.type, a.element, a.mp_cost, a.multiplier, a.armor_pen, a.crit_bonus,
                a.num_hits, a.poison_damage, a.heal_percent, a.guaranteed_hit, a.guaranteed_crit,
                ca.level AS nivel
           FROM character_abilities ca JOIN abilities a ON a.id = ca.ability_id
          WHERE ca.character_id = ?`,
        [personagem.id]
      );
      habilidades = rows.map((r) => ({
        name: r.name, type: r.type, element: ELEMENTO_ALIAS[r.element] || r.element, nivel: r.nivel,
        mpCost: r.mp_cost, multiplier: r.multiplier, armorPen: r.armor_pen, critBonus: r.crit_bonus,
        numHits: r.num_hits, poisonDamage: r.poison_damage, healPercent: r.heal_percent,
        guaranteedHit: !!r.guaranteed_hit, guaranteedCrit: !!r.guaranteed_crit,
      }));
    }

    if (equip.maoSecundaria && equip.maoPrincipal && ARMAS_DUAS_MAOS.includes(equip.maoPrincipal.subcategory)) {
      return res.status(400).json({ error: 'Arma de duas mãos ocupa a mão secundária.' });
    }

    const jogador = montarJogador(personagem, equip);
    const monstro = {
      nome: m.name, hpMax: dm.hpMax, atk: dm.atk, defF: dm.defF, defM: dm.defM,
      precisao: dm.precisao, esquiva: dm.esquiva, velocidade: dm.velocidade,
      chanceCritico: dm.chanceCritico,
      element: ELEMENTO_ALIAS[m.element] || m.element, elementLevel: m.elementLevel || 1,
    };

    const params = { jogador, monstro, habilidades, estrategia: strategy };
    const batalha = simularBatalha(params);
    const resposta = {
      jogador, monstro,
      arma: equip.maoPrincipal ? equip.maoPrincipal.name : null,
      equipamento: Object.fromEntries(Object.entries(equip).map(([k, v]) => [k, v ? v.name : null])),
      habilidadesUsaveis: habilidades.length,
      batalha,
      recompensa: { exp: dm.expReward, zeny: dm.zenyReward },
    };
    if (runs > 1) resposta.estatisticas = simularVarias(params, runs);
    res.json(resposta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao simular batalha.' });
  }
});

module.exports = router;
