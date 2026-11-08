// routes/items.js
// Consulta do banco de itens

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

const COLUNAS = `id, name, type, subcategory, tier, buy_price AS buyPrice,
                 sell_price AS sellPrice, attributes, lore`;

// GET /api/items?type=armas&q=espada
router.get('/', async (req, res) => {
  try {
    const filtros = [];
    const params = [];
    if (req.query.type) { filtros.push('type = ?'); params.push(req.query.type); }
    if (req.query.q) { filtros.push('name LIKE ?'); params.push(`%${req.query.q}%`); }
    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT ${COLUNAS} FROM items ${where} ORDER BY type, tier DESC, name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar itens.' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${COLUNAS} FROM items WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar item.' });
  }
});

module.exports = router;
