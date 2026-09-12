// routes/auth.js
// Rotas de registro e login de jogadores (players)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('../config/db');

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Preencha usuário, email e senha.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Verificar se já existe
    const [existing] = await pool.query(
      'SELECT id FROM players WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Usuário ou email já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO players (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const token = jwt.sign({ playerId: result.insertId }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      player: { id: result.insertId, username, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Preencha usuário e senha.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM players WHERE username = ? OR email = ?',
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const player = rows[0];
    const senhaValida = await bcrypt.compare(password, player.password_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const token = jwt.sign({ playerId: player.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      player: { id: player.id, username: player.username, email: player.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

module.exports = router;
