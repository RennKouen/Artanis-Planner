// services/habilidades.js
// Regras de pre-requisito das habilidades.
//  - Habilidades de classe exigem NOVATO_PONTOS_MINIMOS pontos gastos em habilidades de Novato.
//  - Algumas habilidades exigem nivel minimo em outras habilidades da mesma classe.

const { NOVATO_PONTOS_MINIMOS, PREREQUISITOS } = require('../data/habilidadePrerequisitos');

// lista: [{ gameId, name, classe, aprendido }]
// devolve a mesma lista com { grupo, requisitos, desbloqueada } e o total de pontos de Novato
function avaliarHabilidades(lista) {
  const porId = Object.fromEntries(lista.map((h) => [h.gameId, h]));
  const novatoPontos = lista
    .filter((h) => h.classe === 'novato')
    .reduce((s, h) => s + h.aprendido, 0);

  const avaliadas = lista.map((h) => {
    const requisitos = [];
    if (h.classe !== 'novato') {
      requisitos.push({
        tipo: 'novato',
        descricao: 'Pontos em habilidades de Novato',
        atual: novatoPontos,
        necessario: NOVATO_PONTOS_MINIMOS,
        ok: novatoPontos >= NOVATO_PONTOS_MINIMOS,
      });
    }
    for (const req of PREREQUISITOS[h.gameId] || []) {
      const alvo = porId[req.id];
      const atual = alvo ? alvo.aprendido : 0;
      requisitos.push({
        tipo: 'habilidade',
        descricao: alvo ? alvo.name : req.id,
        atual,
        necessario: req.level,
        ok: atual >= req.level,
      });
    }
    return {
      ...h,
      grupo: h.classe === 'novato' ? 'novato' : 'classe',
      requisitos,
      desbloqueada: requisitos.every((r) => r.ok),
    };
  });

  return { novatoPontos, habilidades: avaliadas };
}

// Verifica se, apos a alteracao, todas as habilidades aprendidas continuam com os requisitos atendidos.
// Devolve o nome da primeira habilidade que ficaria invalida, ou null.
function primeiraInvalida(lista) {
  const { habilidades } = avaliarHabilidades(lista);
  const invalida = habilidades.find((h) => h.aprendido > 0 && !h.desbloqueada);
  return invalida ? invalida.name : null;
}

module.exports = { NOVATO_PONTOS_MINIMOS, avaliarHabilidades, primeiraInvalida };
