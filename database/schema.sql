-- ============================================================
-- Mundo de Artanis -- Planner
-- Schema do banco de dados
-- ============================================================

CREATE DATABASE IF NOT EXISTS artanis_planner
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE artanis_planner;

-- Tabela de jogadores (contas)
CREATE TABLE IF NOT EXISTS players (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de personagens
CREATE TABLE IF NOT EXISTS characters (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    player_id   INT NOT NULL,

    name        VARCHAR(50) NOT NULL,
    class       ENUM('guerreiro','arqueiro','mago','lutador','ladino','feiticeiro') NOT NULL,

    level       INT DEFAULT 1,
    exp         INT DEFAULT 0,
    zeny        INT DEFAULT 50,

    -- Atributos base (fixos no nascimento, iguais para todas as classes)
    str_base    INT DEFAULT 3,
    agi_base    INT DEFAULT 3,
    int_base    INT DEFAULT 3,
    dex_base    INT DEFAULT 3,
    vit_base    INT DEFAULT 3,
    luk_base    INT DEFAULT 3,

    hp_base     INT DEFAULT 100,
    mp_base     INT DEFAULT 100,

    pontos_disponiveis INT DEFAULT 5,

    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indice para buscas rapidas dos personagens de um jogador
CREATE INDEX idx_characters_player ON characters(player_id);

-- Tabela do bestiario
-- Obs: o mesmo monstro (game_id) pode ter varios registros, um por nivel,
-- pois no jogo original cada nivel tem atributos proprios.
CREATE TABLE IF NOT EXISTS monsters (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    game_id        INT NOT NULL,

    name           VARCHAR(100) NOT NULL,
    level          INT DEFAULT 1,
    is_boss        BOOLEAN DEFAULT FALSE,

    str_stat       INT DEFAULT 1,
    agi_stat       INT DEFAULT 1,
    int_stat       INT DEFAULT 1,
    dex_stat       INT DEFAULT 1,
    vit_stat       INT DEFAULT 1,
    luk_stat       INT DEFAULT 1,

    element        VARCHAR(30) DEFAULT 'neutro',
    element_level  INT DEFAULT 1,
    lore           TEXT,
    sprite         VARCHAR(255),

    -- Overrides usados por monstros especiais (ex: bonecos de treino)
    atk_override        INT DEFAULT NULL,
    atk_bonus_override  INT DEFAULT NULL,

    drops          JSON,
    areas          JSON,

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_monsters_level ON monsters(level);
CREATE INDEX idx_monsters_game_id ON monsters(game_id);
