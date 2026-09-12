-- ============================================================
-- Mundo de Artanis -- Planner
-- Schema do banco de dados (AC1)
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
