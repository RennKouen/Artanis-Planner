# Mundo de Artanis — Planner

Site planner para o jogador do RPG **Mundo de Artanis**. Permite criar e gerenciar personagens, montar a build (atributos, nível e habilidades), consultar o bestiário e, futuramente, simular batalhas.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) (versão LTS)
- [MySQL](https://dev.mysql.com/downloads/installer/) 8.0 (Server + Workbench)
- [Git](https://git-scm.com/downloads)

---

## Como rodar o projeto localmente

### 1. Banco de dados

As instruções abaixo funcionam no **PowerShell** e no **CMD** do Windows, usando o cliente de linha de comando do MySQL (evita problemas de codificação que o MySQL Workbench às vezes tem com acentos).

Abra o terminal **na pasta do projeto** (`artanis-planner`). Os comandos abaixo assumem o MySQL instalado em `C:\Program Files\MySQL\MySQL Server 8.0\bin`; ajuste o caminho se o seu for diferente.

**No PowerShell** (o `<` não funciona aqui, use `Get-Content`):

```powershell
Get-Content database\schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
Get-Content database\seed_monsters.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p artanis_planner --default-character-set=utf8mb4
Get-Content database\seed_abilities.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4
```

**No CMD:**

```
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 < database\schema.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p artanis_planner --default-character-set=utf8mb4 < database\seed_monsters.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 < database\seed_abilities.sql
```

Isso cria o banco `artanis_planner` com as tabelas `players`, `characters`, `monsters`, `abilities` e `character_abilities`, já populado com os 56 monstros do bestiário e as 82 habilidades do jogo. Os scripts podem ser executados mais de uma vez sem problema.

Para conferir:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT COUNT(*) FROM artanis_planner.monsters; SELECT COUNT(*) FROM artanis_planner.abilities;"
```

O resultado esperado é 56 monstros e 82 habilidades.

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

O backend sobe em `http://localhost:3001`. Para testar: `http://localhost:3001/api/health`.

### 3. Frontend

Em outro terminal:

```
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173`.

### Atalho (Windows)

Depois da primeira instalação, os arquivos `iniciar-site.bat` e `parar-site.bat` na raiz do projeto sobem e derrubam backend e frontend com um clique.

---

## Estrutura do projeto

```
artanis-planner/
├── backend/
│   ├── config/db.js                     # conexão MySQL
│   ├── middleware/auth.js               # verificação de JWT
│   ├── data/habilidadePrerequisitos.js  # árvore de pré-requisitos das habilidades
│   ├── services/
│   │   ├── derivedStats.js              # fórmulas de atributos derivados e progressão
│   │   └── habilidades.js               # regras de pré-requisito das habilidades
│   ├── routes/
│   │   ├── auth.js                      # registro/login
│   │   ├── characters.js                # personagens, ficha, atributos, nível e habilidades
│   │   └── monsters.js                  # consulta do bestiário
│   └── server.js
├── frontend/
│   ├── public/assets/                   # sprites de classes e monstros
│   └── src/
│       ├── pages/                       # Login, Register, Characters, CharacterSheet, Bestiary
│       ├── components/                  # Sidebar, TopBar, AppLayout, AbilitiesPanel, painéis
│       ├── context/                     # CharactersContext (estado compartilhado)
│       ├── services/                    # api.js (axios + logout automático), monsters.js
│       └── data/                        # classes, elementos, fórmulas e efeitos de habilidades
└── database/
    ├── schema.sql                       # cria o banco e as tabelas de contas, personagens e monstros
    ├── seed_monsters.sql                # popula o bestiário
    └── seed_abilities.sql               # cria as tabelas de habilidades e popula o catálogo
```

---

## Funcionalidades

### Concluído

**Contas e personagens**
- Cadastro e login de conta (JWT). Se o token expirar ou for recusado, o site desloga automaticamente.
- Criação de personagem: nome + classe (Guerreiro, Arqueiro, Mago, Lutador, Ladino, Feiticeiro).
- Uma conta pode ter múltiplos personagens; listagem e exclusão.
- Status iniciais fixos no nível 1 (STR/AGI/INT/DEX/VIT/LUK = 3, HP/MP = 100, 5 pontos de atributo).

**Ficha do personagem**
- Atributos derivados calculados com as fórmulas do jogo: HP e MP máximos, ATK físico/à distância/mágico, DEF física/mágica, precisão, esquiva, velocidade, chance e dano de crítico.
- Distribuição de pontos de atributo com **prévia** dos valores derivados antes de confirmar, e tooltip mostrando o que cada ponto adiciona.
- Definição direta do nível (1 a 40). Cada nível: +5 HP, +2 MP, +3 pontos de atributo e +1 ponto de habilidade.
- Renomear e excluir personagem; reset de atributos.

**Habilidades**
- Catálogo com as 82 habilidades do jogo (Novato + 6 classes).
- Habilidades de Novato disponíveis para todas as classes; as habilidades de classe exigem 5 pontos gastos em Novato.
- Pré-requisitos entre habilidades da mesma classe, com indicação visual do que falta.
- Nível atual e prévia do próximo nível (MP, multiplicador, golpes, bônus etc.).

**Bestiário**
- 56 monstros do jogo: busca por nome, painel de detalhe fixo (atributos, stats de combate derivados, drops, áreas, cor por elemento).

### Em andamento
- Banco de itens (ItemDatabase) e equipamentos

### Planejado
- Simulador de batalha (personagem vs. monstro do bestiário)
- Sistema de EXP pós-batalha e level up automático
- Publicação online do site

---

## Observações

- Os atributos derivados da ficha consideram apenas os atributos base, sem equipamentos (que entram junto com o banco de itens).
- A árvore de pré-requisitos das habilidades é uma proposta do planner e pode ser ajustada em `backend/data/habilidadePrerequisitos.js`.
- Habilidades passivas não têm valores numéricos no banco do jogo; a ficha exibe apenas a descrição delas (exceto as recuperações pós-batalha de Novato).

---

## Gerenciamento do projeto

O backlog e o progresso de cada funcionalidade são acompanhados no board do repositório (aba **Projects** no GitHub).
