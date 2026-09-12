// server.js
// Ponto de entrada do backend — Mundo de Artanis Planner

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Rota de teste / health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mundo de Artanis Planner API rodando.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
