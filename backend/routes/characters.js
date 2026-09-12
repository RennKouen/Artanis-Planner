// routes/characters.js
// CRUD de personagens — todas as rotas exigem autenticação (token JWT)

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

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
    res.json(rows[0]);
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
