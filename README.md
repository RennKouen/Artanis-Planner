# Mundo de Artanis — Planner

Site planner para o jogador do RPG "Mundo de Artanis" — permite criar e gerenciar personagens.

Projeto de TCC — disciplina Projeto de Software.

---

## Stack

- **Backend:** Node.js + Express + MySQL (mysql2) + JWT + bcrypt
- **Frontend:** React + Vite + React Router + Axios
- **Banco de dados:** MySQL

---

## Como rodar o projeto localmente

### 1. Banco de dados

Instale o MySQL e execute o script:

```bash
mysql -u root -p < database/schema.sql
```

Isso cria o banco `artanis_planner` com as tabelas `players` e `characters`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com sua senha do MySQL
npm run dev
```

O backend sobe em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173`.

---

## Estrutura do projeto

```
artanis-planner/
├── backend/
│   ├── config/db.js          # conexão MySQL
│   ├── middleware/auth.js    # verificação de JWT
│   ├── routes/auth.js        # registro/login
│   ├── routes/characters.js  # CRUD de personagens
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/            # Login, Register, Characters
│       ├── components/       # ProtectedRoute, CreateCharacterModal
│       ├── services/api.js   # instância axios
│       └── data/classes.js   # referência das 6 classes
└── database/
    └── schema.sql
```

---

## Funcionalidades — AC1

- Cadastro e login de conta (JWT)
- Criação de personagem: nome + classe (Guerreiro, Arqueiro, Mago, Lutador, Ladino, Feiticeiro)
- Status iniciais fixos no nível 1 (STR/AGI/INT/DEX/VIT/LUK = 3, HP/MP = 100)
- Uma conta pode ter múltiplos personagens
- Listagem e exclusão de personagens

## Roadmap (próximas entregas)

- **AC2:** Ficha detalhada do personagem + evolução de classe
- **AC3:** Simulação de batalha (importando MonsterDatabase/ItemDatabase)
- **Final:** Habilidades + sistema de EXP/level up
