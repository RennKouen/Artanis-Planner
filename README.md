# Mundo de Artanis — Planner

Site planner para o jogador do RPG "Mundo de Artanis" — permite criar e gerenciar personagens, consultar o bestiario, e futuramente simular batalhas e acompanhar progressao.

---

## Pre-requisitos

- [Node.js](https://nodejs.org) (versao LTS)
- [MySQL](https://dev.mysql.com/downloads/installer/) (Server + Workbench)
- [Git](https://git-scm.com/downloads)

---

## Como rodar o projeto localmente

### 1. Banco de dados

As instrucoes abaixo funcionam tanto no **CMD** quanto no **PowerShell** do Windows,
usando o cliente de linha de comando do MySQL (evita problemas de encoding que o
MySQL Workbench as vezes tem com acentos).

Abra um terminal na pasta `bin` da sua instalacao do MySQL, por exemplo:

```
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

**No CMD:**
```
mysql -u root -p --default-character-set=utf8mb4 < "CAMINHO\artanis-planner\database\schema.sql"
mysql -u root -p artanis_planner --default-character-set=utf8mb4 < "CAMINHO\artanis-planner\database\seed_monsters.sql"
```

**No PowerShell** (o `<` nao funciona aqui, use `Get-Content`):
```
Get-Content "CAMINHO\artanis-planner\database\schema.sql" | .\mysql.exe -u root -p --default-character-set=utf8mb4
Get-Content "CAMINHO\artanis-planner\database\seed_monsters.sql" | .\mysql.exe -u root -p artanis_planner --default-character-set=utf8mb4
```

Troque `CAMINHO` pelo caminho real onde voce colocou a pasta `artanis-planner`.

Isso cria o banco `artanis_planner` com as tabelas `players`, `characters` e `monsters`
(ja populada com os 56 monstros do bestiario).

Para conferir que funcionou:
```
mysql -u root -p -e "USE artanis_planner; SHOW TABLES; SELECT COUNT(*) FROM monsters;"
```

### 2. Backend

```
cd backend
npm install
copy .env.example .env
```
Abra o `.env` num editor de texto e preencha `DB_PASSWORD` com a senha do seu MySQL.

```
npm run dev
```

O backend sobe em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```
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
│   ├── config/db.js          # conexao MySQL
│   ├── middleware/auth.js    # verificacao de JWT
│   ├── routes/auth.js        # registro/login
│   ├── routes/characters.js  # CRUD de personagens
│   ├── routes/monsters.js    # consulta do bestiario
│   └── server.js
├── frontend/
│   ├── public/assets/        # sprites de classes e monstros
│   └── src/
│       ├── pages/            # Login, Register, Characters, Bestiary
│       ├── components/       # Sidebar, TopBar, AppLayout, modais, paineis
│       ├── context/          # CharactersContext (estado compartilhado)
│       ├── services/         # api.js, monsters.js
│       └── data/             # classes.js, elements.js
└── database/
    ├── schema.sql            # cria as tabelas
    └── seed_monsters.sql     # popula o bestiario
```

---

## Funcionalidades

### Concluido
- Cadastro e login de conta (JWT)
- Criacao de personagem: nome + classe (Guerreiro, Arqueiro, Mago, Lutador, Ladino, Feiticeiro)
- Status iniciais fixos no nivel 1 (STR/AGI/INT/DEX/VIT/LUK = 3, HP/MP = 100)
- Uma conta pode ter multiplos personagens
- Listagem e exclusao de personagens
- Bestiario com os 56 monstros do jogo: busca por nome, painel de detalhe fixo
  (atributos, stats de combate derivados, drops, areas, cor por elemento)

### Em andamento
- Ficha detalhada do personagem (atributos derivados, edicao)
- Planejamento da insercao do banco de itens (ItemDatabase)

### Planejado
- Simulador de batalha (personagem vs. monstro do bestiario)
- Habilidades por classe

---

## Gerenciamento do projeto

O backlog e o progresso de cada funcionalidade sao acompanhados no board do
repositorio (aba **Projects** no GitHub).

