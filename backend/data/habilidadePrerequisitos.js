// data/habilidadePrerequisitos.js
// Pre-requisitos das habilidades (chave = game_id da habilidade).
// Cada requisito: { id: game_id da habilidade exigida, level: nivel minimo }.
// Habilidades sem entrada aqui so exigem o desbloqueio geral das habilidades de classe.

// Pontos que precisam estar gastos em habilidades de Novato para liberar habilidades de classe
const NOVATO_PONTOS_MINIMOS = 5;

const PREREQUISITOS = {
  // warrior
  "postura_defensiva": [{ id: "escudo_total", level: 2 }],
  "investida_protegida": [{ id: "escudo_total", level: 3 }],
  "contra_ataque": [{ id: "investida_protegida", level: 2 }],
  "segundo_folego": [{ id: "grito_de_guerra", level: 2 }],
  "grito_intimidador": [{ id: "grito_de_batalha", level: 2 }],
  "golpe_congelante": [{ id: "grito_intimidador", level: 2 }],
  "forca_bruta": [{ id: "golpe_brutal", level: 2 }],
  "furia_berserker": [{ id: "golpe_brutal", level: 3 }],
  "fenda_terrivel": [{ id: "furia_berserker", level: 3 }],
  // archer
  "olho_de_aguia": [{ id: "tiro_preciso", level: 2 }],
  "chuva_de_flechas": [{ id: "tiro_preciso", level: 3 }],
  "tiro_penetrante": [{ id: "tiro_preciso", level: 3 }],
  "saraivada": [{ id: "chuva_de_flechas", level: 2 }],
  "mira_mortal": [{ id: "olho_de_aguia", level: 3 }, { id: "tiro_penetrante", level: 2 }],
  "flecha_explosiva": [{ id: "tiro_penetrante", level: 3 }],
  "tiro_cerceador": [{ id: "flecha_cegante", level: 2 }],
  "rajada_de_vento": [{ id: "vento_nas_costas", level: 2 }],
  // fighter
  "rajada_de_golpes": [{ id: "soco_carregado", level: 2 }],
  "golpe_esmagador": [{ id: "soco_carregado", level: 3 }],
  "soco_supremo": [{ id: "golpe_esmagador", level: 3 }, { id: "rajada_de_golpes", level: 2 }],
  "tornado_de_golpes": [{ id: "rajada_de_golpes", level: 3 }],
  "passo_relampago": [{ id: "adrenalina", level: 2 }],
  "contra_velocidade": [{ id: "rajada_de_golpes", level: 2 }, { id: "passo_relampago", level: 2 }],
  "pele_de_ferro": [{ id: "adrenalina", level: 2 }],
  "recuperacao_lutador": [{ id: "pele_de_ferro", level: 2 }],
  "sangramento_profundo": [{ id: "quebra_guarda", level: 2 }],
  // magician
  "raio": [{ id: "centelha", level: 2 }],
  "amplificar": [{ id: "centelha", level: 2 }],
  "gelo_penetrante": [{ id: "bola_de_fogo", level: 2 }],
  "meteoro": [{ id: "bola_de_fogo", level: 3 }, { id: "amplificar", level: 2 }],
  "cura_arcana": [{ id: "escudo_arcano", level: 2 }],
  "barreira_gelada": [{ id: "escudo_arcano", level: 3 }],
  "concentracao_magica": [{ id: "amplificar", level: 2 }],
  "lentidao_pesada": [{ id: "lentidao_arcana", level: 3 }],
  "silencio_arcano": [{ id: "lentidao_arcana", level: 2 }],
  "toque_glacial": [{ id: "lentidao_arcana", level: 2 }, { id: "gelo_penetrante", level: 2 }],
  // rogue
  "golpe_nas_sombras": [{ id: "ataque_furtivo", level: 2 }],
  "emboscada": [{ id: "ataque_furtivo", level: 3 }, { id: "golpe_nas_sombras", level: 2 }],
  "veneno_corrosivo": [{ id: "veneno_na_lamina", level: 2 }],
  "nuvem_toxica": [{ id: "veneno_corrosivo", level: 3 }],
  "lamina_sangrenta": [{ id: "veneno_na_lamina", level: 2 }],
  "esquiva_mortal": [{ id: "impulso_sombrio", level: 2 }],
  "reflexos_aguçados": [{ id: "impulso_sombrio", level: 2 }],
  "contra_sombra": [{ id: "esquiva_mortal", level: 2 }, { id: "golpe_nas_sombras", level: 2 }],
  // sorcerer
  "drenar_vida": [{ id: "toque_das_sombras", level: 2 }],
  "maldição_sombria": [{ id: "explosao_sombria", level: 2 }],
  "dominio_sombrio": [{ id: "explosao_sombria", level: 2 }],
  "raio_sombrio": [{ id: "explosao_sombria", level: 3 }],
  "abismo_negro": [{ id: "explosao_sombria", level: 3 }, { id: "dominio_sombrio", level: 2 }],
  "vortice_de_almas": [{ id: "drenar_vida", level: 3 }],
  "pacto_sanguineo": [{ id: "escudo_sombrio", level: 2 }],
  "maldicao_profunda": [{ id: "maldição_sombria", level: 2 }],
  "maldição_temporal": [{ id: "maldicao_profunda", level: 2 }],
  "petrificacao": [{ id: "maldição_temporal", level: 2 }],
  "chama_persistente": [{ id: "maldição_sombria", level: 3 }],
};

module.exports = { NOVATO_PONTOS_MINIMOS, PREREQUISITOS };
