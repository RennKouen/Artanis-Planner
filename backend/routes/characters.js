// routes/characters.js
// CRUD de personagens — todas as rotas exigem autenticação (token JWT)

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const {
  NIVEL_MAXIMO, montarFicha, progressaoDoNivel, pontosGastosEmAtributos, CLASSE_NO_JOGO,
} = require('../services/derivedStats');
const { NOVATO_PONTOS_MINIMOS, avaliarHabilidades, primeiraInvalida } = require('../services/habilidades');

const CLASSES_VALIDAS = ['guerreiro', 'arqueiro', 'mago', 'lutador', 'ladino', 'feiticeiro'];

router.use(authMiddleware); // todas as rotas abaixo exigem login

// ── GET /api/characters — lista os personagens do jogador logado ──
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE player_id = ? ORDER BY created_at DESC',
      [req.playerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar personagens.' });
  }
});

// ── GET /api/characters/:id — detalhe de um personagem ──
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE id = ? AND player_id = ?',
      [req.params.id, req.playerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }
    res.json(montarFicha(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar personagem.' });
  }
});

// ── POST /api/characters — cria um novo personagem ──
router.post('/', async (req, res) => {
  try {
    const { name, class: classe } = req.body;

    if (!name || !classe) {
      return res.status(400).json({ error: 'Informe nome e classe do personagem.' });
    }
    if (!CLASSES_VALIDAS.includes(classe)) {
      return res.status(400).json({ error: 'Classe inválida.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'O nome deve ter ao menos 2 caracteres.' });
    }

    // Atributos base fixos — iguais para todas as classes no nascimento
    const [result] = await pool.query(
      `INSERT INTO characters
        (player_id, name, class, level, exp, zeny,
         str_base, agi_base, int_base, dex_base, vit_base, luk_base,
         hp_base, mp_base, pontos_disponiveis)
       VALUES (?, ?, ?, 1, 0, 50, 3, 3, 3, 3, 3, 3, 100, 100, 5)`,
      [req.playerId, name.trim(), classe]
    );

    const [novo] = await pool.query('SELECT * FROM characters WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Personagem criado com sucesso!',
      character: novo[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar personagem.' });
  }
});

// ── Helper: busca personagem do jogador logado ──
async function buscarPersonagem(id, playerId) {
  const [rows] = await pool.query(
    'SELECT * FROM characters WHERE id = ? AND player_id = ?',
    [id, playerId]
  );
  return rows[0] || null;
}

const ATRIBUTOS = ['str', 'agi', 'int', 'dex', 'vit', 'luk'];

// ── PUT /api/characters/:id — renomeia o personagem ──
router.put('/:id', async (req, res) => {
  try {
    const nome = (req.body.name || '').trim();
    if (nome.length < 2 || nome.length > 50) {
      return res.status(400).json({ error: 'O nome deve ter entre 2 e 50 caracteres.' });
    }
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });

    await pool.query('UPDATE characters SET name = ? WHERE id = ?', [nome, personagem.id]);
    res.json(montarFicha({ ...personagem, name: nome }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar personagem.' });
  }
});

// ── POST /api/characters/:id/atributos — distribui pontos disponíveis ──
// body: { str: 1, vit: 2, ... } (quantidade de pontos por atributo)
router.post('/:id/atributos', async (req, res) => {
  try {
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });

    let total = 0;
    const incrementos = {};
    for (const attr of ATRIBUTOS) {
      const v = Number(req.body[attr] || 0);
      if (!Number.isInteger(v) || v < 0) {
        return res.status(400).json({ error: 'Quantidade de pontos inválida.' });
      }
      incrementos[attr] = v;
      total += v;
    }
    if (total === 0) return res.status(400).json({ error: 'Nenhum ponto distribuído.' });
    if (total > personagem.pontos_disponiveis) {
      return res.status(400).json({ error: 'Pontos insuficientes.' });
    }

    await pool.query(
      `UPDATE characters SET
         str_base = str_base + ?, agi_base = agi_base + ?, int_base = int_base + ?,
         dex_base = dex_base + ?, vit_base = vit_base + ?, luk_base = luk_base + ?,
         pontos_disponiveis = pontos_disponiveis - ?
       WHERE id = ?`,
      [incrementos.str, incrementos.agi, incrementos.int, incrementos.dex,
       incrementos.vit, incrementos.luk, total, personagem.id]
    );

    const atualizado = await buscarPersonagem(personagem.id, req.playerId);
    res.json(montarFicha(atualizado));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao distribuir pontos.' });
  }
});

// ── POST /api/characters/:id/nivel — define o nivel diretamente ──
// Recalcula HP/MP base e pontos disponiveis. Se os pontos ja gastos nao couberem
// no novo nivel, atributos e/ou habilidades sao resetados.
router.post('/:id/nivel', async (req, res) => {
  try {
    const level = Number(req.body.level);
    if (!Number.isInteger(level) || level < 1 || level > NIVEL_MAXIMO) {
      return res.status(400).json({ error: `O nível deve estar entre 1 e ${NIVEL_MAXIMO}.` });
    }
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const prog = progressaoDoNivel(level);
    const gastosAttr = pontosGastosEmAtributos(personagem);
    let resetouAtributos = false;
    let attrs = {
      str: personagem.str_base, agi: personagem.agi_base, int: personagem.int_base,
      dex: personagem.dex_base, vit: personagem.vit_base, luk: personagem.luk_base,
    };
    let pontos = prog.pontosTotais - gastosAttr;
    if (pontos < 0) {
      attrs = { str: 3, agi: 3, int: 3, dex: 3, vit: 3, luk: 3 };
      pontos = prog.pontosTotais;
      resetouAtributos = true;
    }

    await pool.query(
      `UPDATE characters SET level = ?, exp = 0, hp_base = ?, mp_base = ?, pontos_disponiveis = ?,
         str_base = ?, agi_base = ?, int_base = ?, dex_base = ?, vit_base = ?, luk_base = ?
       WHERE id = ?`,
      [level, prog.hp_base, prog.mp_base, pontos,
       attrs.str, attrs.agi, attrs.int, attrs.dex, attrs.vit, attrs.luk, personagem.id]
    );

    const [[{ gastos }]] = await pool.query(
      'SELECT COALESCE(SUM(level), 0) AS gastos FROM character_abilities WHERE character_id = ?',
      [personagem.id]
    );
    let resetouHabilidades = false;
    if (Number(gastos) > prog.pontosHabilidadeTotais) {
      await pool.query('DELETE FROM character_abilities WHERE character_id = ?', [personagem.id]);
      resetouHabilidades = true;
    }

    const atualizado = await buscarPersonagem(personagem.id, req.playerId);
    res.json({ resetouAtributos, resetouHabilidades, character: montarFicha(atualizado) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao definir nível.' });
  }
});

// ── POST /api/characters/:id/resetar-atributos — devolve todos os pontos distribuidos ──
router.post('/:id/resetar-atributos', async (req, res) => {
  try {
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const prog = progressaoDoNivel(personagem.level);
    await pool.query(
      `UPDATE characters SET str_base = 3, agi_base = 3, int_base = 3, dex_base = 3,
         vit_base = 3, luk_base = 3, pontos_disponiveis = ? WHERE id = ?`,
      [prog.pontosTotais, personagem.id]
    );
    const atualizado = await buscarPersonagem(personagem.id, req.playerId);
    res.json(montarFicha(atualizado));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao resetar atributos.' });
  }
});

// ── Habilidades ───────────────────────────────────────────────

// Monta a lista bruta: habilidades de Novato + da classe, com o nivel aprendido
async function listarHabilidades(personagem) {
  const classeJogo = CLASSE_NO_JOGO[personagem.class];
  const [rows] = await pool.query(
    `SELECT a.*, COALESCE(ca.level, 0) AS aprendido
       FROM abilities a
       LEFT JOIN character_abilities ca
         ON ca.ability_id = a.id AND ca.character_id = ?
      WHERE a.class IN ('novato', ?)
      ORDER BY (a.class = 'novato') DESC, a.numeric_id`,
    [personagem.id, classeJogo]
  );
  return rows.map((h) => ({
    id: h.id,
    gameId: h.game_id,
    classe: h.class,
    name: h.name,
    description: h.description,
    type: h.type,
    element: h.element,
    maxLevel: h.max_level,
    guaranteedHit: !!h.guaranteed_hit,
    guaranteedCrit: !!h.guaranteed_crit,
    mpCost: h.mp_cost,
    multiplier: h.multiplier,
    armorPen: h.armor_pen,
    defBonus: h.def_bonus,
    critBonus: h.crit_bonus,
    numHits: h.num_hits,
    poisonDamage: h.poison_damage,
    healPercent: h.heal_percent,
    aprendido: h.aprendido,
  }));
}

function montarHabilidades(personagem, lista) {
  const { novatoPontos, habilidades } = avaliarHabilidades(lista);
  const gastos = habilidades.reduce((soma, h) => soma + h.aprendido, 0);
  const total = progressaoDoNivel(personagem.level).pontosHabilidadeTotais;
  return {
    pontos: { total, gastos, disponiveis: total - gastos },
    novato: { pontos: novatoPontos, necessario: NOVATO_PONTOS_MINIMOS },
    habilidades,
  };
}

// GET /api/characters/:id/habilidades
router.get('/:id/habilidades', async (req, res) => {
  try {
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });
    res.json(montarHabilidades(personagem, await listarHabilidades(personagem)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar habilidades.' });
  }
});

// POST /api/characters/:id/habilidades  body: { abilityId, delta: 1 | -1 }
router.post('/:id/habilidades', async (req, res) => {
  try {
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });

    const abilityId = Number(req.body.abilityId);
    const delta = Number(req.body.delta);
    if (!Number.isInteger(abilityId) || (delta !== 1 && delta !== -1)) {
      return res.status(400).json({ error: 'Requisição inválida.' });
    }

    const lista = await listarHabilidades(personagem);
    const alvo = lista.find((h) => h.id === abilityId);
    if (!alvo) {
      return res.status(404).json({ error: 'Habilidade não disponível para esta classe.' });
    }

    const novo = alvo.aprendido + delta;
    if (novo < 0 || novo > alvo.maxLevel) {
      return res.status(400).json({ error: 'Nível de habilidade fora do limite.' });
    }

    const estado = montarHabilidades(personagem, lista);
    if (delta === 1 && estado.pontos.disponiveis <= 0) {
      return res.status(400).json({ error: 'Sem pontos de habilidade disponíveis.' });
    }
    if (delta === 1 && alvo.aprendido === 0) {
      const atual = estado.habilidades.find((h) => h.id === abilityId);
      if (!atual.desbloqueada) {
        return res.status(400).json({ error: 'Pré-requisitos não atendidos para esta habilidade.' });
      }
    }
    if (delta === -1) {
      const simulada = lista.map((h) => (h.id === abilityId ? { ...h, aprendido: novo } : h));
      const quebra = primeiraInvalida(simulada);
      if (quebra) {
        return res.status(400).json({ error: `Não é possível reduzir: "${quebra}" depende desta habilidade.` });
      }
    }

    if (novo === 0) {
      await pool.query(
        'DELETE FROM character_abilities WHERE character_id = ? AND ability_id = ?',
        [personagem.id, abilityId]
      );
    } else {
      await pool.query(
        `INSERT INTO character_abilities (character_id, ability_id, level) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE level = VALUES(level)`,
        [personagem.id, abilityId, novo]
      );
    }
    res.json(montarHabilidades(personagem, await listarHabilidades(personagem)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar habilidade.' });
  }
});

// POST /api/characters/:id/resetar-habilidades
router.post('/:id/resetar-habilidades', async (req, res) => {
  try {
    const personagem = await buscarPersonagem(req.params.id, req.playerId);
    if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado.' });
    await pool.query('DELETE FROM character_abilities WHERE character_id = ?', [personagem.id]);
    res.json(montarHabilidades(personagem, await listarHabilidades(personagem)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao resetar habilidades.' });
  }
});

// ── DELETE /api/characters/:id — remove um personagem ──
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM characters WHERE id = ? AND player_id = ?',
      [req.params.id, req.playerId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }
    res.json({ message: 'Personagem removido.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover personagem.' });
  }
});

module.exports = router;
