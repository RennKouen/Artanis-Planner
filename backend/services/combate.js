// services/combate.js
// Simulador de batalha — port das formulas do CombatManager.cs (modelo ATB).
//
// Cobertura desta versao:
//  - Ataque basico e habilidades de dano do jogador (dano fisico/magico/distancia, buff_dano)
//  - Acerto, esquiva, defesa logaritmica, critico, elementos, veneno e roubo de vida
//  - Ataque basico do monstro
// Nao simulados: buffs/debuffs/curas do jogador, habilidades de monstros e consumiveis.

const { modificador } = require('./elementos');

// ── Constantes (idênticas ao jogo) ───────────────────────────
const ATB_MAX = 300;
const ATB_JOGADOR_INICIAL = 150;
const ACERTO_BASE = 0.85;
const ACERTO_ESCALA = 0.020;
const ACERTO_MIN = 0.15;
const ACERTO_MAX = 0.97;
const DEF_K = 11.6;
const DEF_TETO = 0.80;
const DEF_A = 0.10 / Math.log(1 + 10 / DEF_K);
const ESQ_K = 11.6;
const ESQ_TETO = 0.75;
const ESQ_A = 0.10 / Math.log(1 + 10 / ESQ_K);
const REDUCAO_MAX_MONSTRO = 0.92;
const LIMITE_ACOES = 1500;

// ── Fórmulas ─────────────────────────────────────────────────
function chanceAcerto(precisao, esquiva, garantido = false) {
  if (garantido) return 1;
  const chance = ACERTO_BASE + (precisao - esquiva) * ACERTO_ESCALA;
  return Math.min(ACERTO_MAX, Math.max(ACERTO_MIN, chance));
}

function reducaoDano(defesa, armorPen = 0) {
  const bruta = Math.min(DEF_TETO, DEF_A * Math.log(1 + defesa / DEF_K));
  return bruta * (1 - armorPen);
}

function chanceEsquiva(esquiva, precisao) {
  const diff = Math.max(0, esquiva - precisao);
  return Math.min(ESQ_TETO, ESQ_A * Math.log(1 + diff / ESQ_K));
}

// PRNG com semente (mulberry32) — permite repetir uma simulação
function criarRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const nivelHab = (lista, nv) => (lista && lista.length ? lista[Math.min(nv, lista.length) - 1] : 0) || 0;

/**
 * jogador: { nome, hpMax, mpMax, atkF, atkR, atkM, bonusArma {fisico, distancia, magico}, defF, defM, precisao,
 *            esquiva, velocidade, chanceCritico, danoCritico, usaDistancia, elementoAtk }
 * monstro: { nome, hpMax, atk, defF, defM, precisao, esquiva, velocidade, chanceCritico,
 *            element, elementLevel }
 * habilidades: [{ name, type, element, nivel, mpCost[], multiplier[], armorPen[], critBonus[],
 *                 numHits[], poisonDamage[], healPercent[], guaranteedHit, guaranteedCrit }]
 * estrategia: 'basico' | 'habilidades'
 */
function simularBatalha({ jogador, monstro, habilidades = [], estrategia = 'basico', seed }) {
  const rng = criarRng(seed ?? Math.floor(Math.random() * 4294967296));
  const rand = (min, max) => min + Math.floor(rng() * (max - min + 1));
  const log = [];

  let hpJ = jogador.hpMax;
  let mpJ = jogador.mpMax;
  let hpM = monstro.hpMax;
  let atbJ = ATB_JOGADOR_INICIAL;
  let atbM = 0;
  let acoes = 0;
  let venenoDano = 0;
  let venenoTurnos = 0;
  let danoCausado = 0;
  let danoRecebido = 0;
  let criticosJ = 0;
  let errosJ = 0;

  const add = (tipo, texto) => log.push({ turno: acoes, tipo, texto, hpJ, hpM });

  add('sistema', `Batalha iniciada: ${jogador.nome} vs ${monstro.nome}!`);

  const usaveis = estrategia === 'habilidades'
    ? habilidades.filter((h) => ['dano_fisico', 'dano_magico', 'dano_distancia', 'buff_dano'].includes(h.type))
    : [];

  function escolherHabilidade() {
    let melhor = null;
    let melhorValor = 0;
    for (const h of usaveis) {
      const custo = nivelHab(h.mpCost, h.nivel);
      if (custo > mpJ) continue;
      const valor = nivelHab(h.multiplier, h.nivel) * Math.max(1, nivelHab(h.numHits, h.nivel));
      if (valor > melhorValor) { melhor = h; melhorValor = valor; }
    }
    return melhor;
  }

  function faixaDeDano(tipoAtk) {
    // tipoAtk: 'fisico' | 'distancia' | 'magico'
    const total = tipoAtk === 'magico' ? jogador.atkM : tipoAtk === 'distancia' ? jogador.atkR : jogador.atkF;
    const bonus = (jogador.bonusArma && jogador.bonusArma[tipoAtk]) || 0;
    return [Math.max(1, total - bonus), total];
  }

  function ataqueBasico() {
    const hit = Math.min(ACERTO_MAX, chanceAcerto(jogador.precisao, monstro.esquiva));
    if (rng() >= hit) {
      errosJ++;
      add('erro', `${jogador.nome} errou o ataque!`);
      return;
    }
    const [min, max] = faixaDeDano(jogador.usaDistancia ? 'distancia' : 'fisico');
    let dano = rand(min, max);
    let critico = false;
    if (rng() < jogador.chanceCritico) { dano = Math.floor(dano * jogador.danoCritico); critico = true; }
    dano = Math.max(1, Math.floor(dano * (1 - reducaoDano(monstro.defF))));
    const mod = modificador(jogador.elementoAtk, monstro.element, monstro.elementLevel);
    dano = mod > 0 ? Math.max(1, Math.floor(dano * mod)) : 0;
    hpM = Math.max(0, hpM - dano);
    danoCausado += dano;
    if (critico) criticosJ++;
    const elem = jogador.elementoAtk !== 'neutro' ? ` [${jogador.elementoAtk}]` : '';
    const nota = mod === 0 ? ' IMUNE!' : mod >= 1.5 ? ' FRACO!' : '';
    add(critico ? 'critico' : 'dano', `${critico ? 'Crítico! ' : ''}${jogador.nome} causou ${dano} de dano${elem}${nota}`);
  }

  function usarHabilidade(h) {
    const nv = h.nivel;
    const custo = nivelHab(h.mpCost, nv);
    mpJ -= custo;
    const isMagic = h.type === 'dano_magico';
    const tipoAtk = isMagic ? 'magico' : (h.type === 'dano_distancia' || jogador.usaDistancia ? 'distancia' : 'fisico');
    const [min, max] = faixaDeDano(tipoAtk);
    const dano = Math.floor(rand(min, max) * nivelHab(h.multiplier, nv));
    const defAlvo = isMagic ? monstro.defM : monstro.defF;
    const reducao = reducaoDano(defAlvo, nivelHab(h.armorPen, nv));
    let danoHit = Math.max(1, Math.floor(dano * (1 - reducao)));
    const numHits = Math.max(1, nivelHab(h.numHits, nv));

    const hit = h.guaranteedHit ? 1 : chanceAcerto(jogador.precisao, monstro.esquiva);
    if (rng() >= hit) {
      errosJ++;
      add('erro', `${h.name} errou! (-${custo} MP)`);
      return;
    }
    let critico = false;
    if (h.guaranteedCrit) { danoHit = Math.floor(danoHit * jogador.danoCritico); critico = true; }
    else if (rng() < jogador.chanceCritico + nivelHab(h.critBonus, nv)) {
      danoHit = Math.floor(danoHit * jogador.danoCritico); critico = true;
    }
    let total = danoHit * numHits;
    const elem = h.element === 'neutro' && !isMagic ? jogador.elementoAtk : h.element;
    const mod = modificador(elem, monstro.element, monstro.elementLevel);
    total = mod > 0 ? Math.max(1, Math.floor(total * mod)) : 0;
    hpM = Math.max(0, hpM - total);
    danoCausado += total;
    if (critico) criticosJ++;

    const veneno = nivelHab(h.poisonDamage, nv);
    if (veneno > 0) {
      venenoDano = Math.max(1, Math.floor(monstro.hpMax * veneno));
      venenoTurnos = 3;
    }
    let roubo = '';
    const cura = nivelHab(h.healPercent, nv);
    if (cura > 0 && total > 0) {
      const v = Math.max(1, Math.floor(total * cura));
      hpJ = Math.min(jogador.hpMax, hpJ + v);
      roubo = ` Drenou ${v} HP.`;
    }
    const elemTxt = elem !== 'neutro' ? ` [${elem}]` : '';
    const nota = mod === 0 ? ' IMUNE!' : mod >= 1.5 ? ' FRACO!' : '';
    const hits = numHits > 1 ? ` x${numHits}` : '';
    const venTxt = veneno > 0 ? ` Envenenado (${venenoDano}/turno).` : '';
    add(critico ? 'critico' : 'habilidade',
      `${h.name}${critico ? ' CRÍTICO!' : '!'} ${total} de dano${elemTxt}${nota}${hits} (-${custo} MP).${roubo}${venTxt}`);
  }

  function turnoJogador() {
    acoes++;
    const hab = escolherHabilidade();
    if (hab) usarHabilidade(hab); else ataqueBasico();
  }

  function turnoMonstro() {
    if (venenoTurnos > 0) {
      hpM = Math.max(0, hpM - venenoDano);
      venenoTurnos--;
      danoCausado += venenoDano;
      add('status', `Veneno causou ${venenoDano} de dano a ${monstro.nome}.`);
      if (hpM <= 0) return;
    }
    const esq = chanceEsquiva(jogador.esquiva, monstro.precisao);
    if (rng() < esq) {
      add('esquiva', `${jogador.nome} esquivou do ataque de ${monstro.nome}!`);
      return;
    }
    let dano = Math.max(1, rand(monstro.atk - 5, monstro.atk));
    let critico = false;
    if (rng() < monstro.chanceCritico) { dano = Math.floor(dano * 1.5); critico = true; }
    const reducao = Math.min(REDUCAO_MAX_MONSTRO, reducaoDano(jogador.defF));
    dano = Math.max(1, Math.floor(dano * (1 - reducao)));
    hpJ = Math.max(0, hpJ - dano);
    danoRecebido += dano;
    add(critico ? 'critico-monstro' : 'dano-monstro',
      `${critico ? 'Crítico! ' : ''}${monstro.nome} causou ${dano} de dano.`);
  }

  let resultado = 'derrota';
  while (true) {
    if (acoes >= LIMITE_ACOES) { resultado = 'empate'; add('sistema', 'Limite de turnos atingido — batalha interrompida.'); break; }

    // avança o ATB até alguém chegar em 300
    const tJ = Math.max(0, Math.ceil((ATB_MAX - atbJ) / jogador.velocidade));
    const tM = Math.max(0, Math.ceil((ATB_MAX - atbM) / monstro.velocidade));
    const t = Math.min(tJ, tM);
    atbJ += jogador.velocidade * t;
    atbM += monstro.velocidade * t;

    if (atbJ >= ATB_MAX) {
      turnoJogador();
      atbJ = 0;
      if (hpM <= 0) { resultado = 'vitoria'; break; }
      if (atbM >= ATB_MAX) {
        atbM = 0;
        turnoMonstro();
        if (hpM <= 0) { resultado = 'vitoria'; break; }
        if (hpJ <= 0) break;
      }
    } else if (atbM >= ATB_MAX) {
      atbM = 0;
      turnoMonstro();
      if (hpM <= 0) { resultado = 'vitoria'; break; }
      if (hpJ <= 0) break;
    }
    if (hpJ <= 0) break;
  }

  if (resultado === 'vitoria') add('sistema', `${jogador.nome} derrotou ${monstro.nome}!`);
  else if (resultado === 'derrota') add('sistema', `${jogador.nome} foi derrotado por ${monstro.nome}.`);

  return {
    resultado, acoes, hpJogador: hpJ, hpMonstro: hpM, mpJogador: mpJ,
    danoCausado, danoRecebido, criticos: criticosJ, erros: errosJ, log,
  };
}

// Executa várias simulações e resume estatísticas (sem guardar o log de cada uma)
function simularVarias(params, runs) {
  let vitorias = 0, derrotas = 0, empates = 0;
  let somaAcoes = 0, somaHpVitoria = 0;
  for (let i = 0; i < runs; i++) {
    const r = simularBatalha({ ...params, seed: Math.floor(Math.random() * 4294967296) });
    if (r.resultado === 'vitoria') { vitorias++; somaHpVitoria += r.hpJogador / params.jogador.hpMax; }
    else if (r.resultado === 'derrota') derrotas++;
    else empates++;
    somaAcoes += r.acoes;
  }
  return {
    runs, vitorias, derrotas, empates,
    taxaVitoria: vitorias / runs,
    mediaAcoes: Math.round((somaAcoes / runs) * 10) / 10,
    hpMedioNasVitorias: vitorias ? Math.round((somaHpVitoria / vitorias) * 100) / 100 : 0,
  };
}

module.exports = {
  ATB_MAX, chanceAcerto, reducaoDano, chanceEsquiva, simularBatalha, simularVarias,
};
