-- ============================================================
-- Mundo de Artanis -- Correcao de dados
-- O elemento "gelo" nao existe na tabela de elementos do jogo.
-- Os elementos validos sao: neutro, agua, fogo, terra, vento, sagrado, sombrio.
-- Este script corrige todos os monstros cadastrados como "gelo" para "agua".
-- ============================================================

USE artanis_planner;

UPDATE monsters
SET element = 'agua'
WHERE element = 'gelo';

-- Conferencia: deve retornar 0 linhas apos a correcao
SELECT id, name, level, element FROM monsters WHERE element = 'gelo';
