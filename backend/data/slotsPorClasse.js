// data/slotsPorClasse.js
// Restrições de equipamento por classe, portadas de PlayerClassConfig (SaveSystem.cs).
// Chaves = classe do site (pt). Ajuste da mão secundária definido pelo design do jogo:
//   guerreiro: escudo | arqueiro: aljava | mago/feiticeiro: tomo, orb
//   ladino: adaga | lutador: soqueira, tonfa (mãos secundárias "semelhantes" à primária)
const COURO = ['armadura de couro', 'elmo de couro', 'luvas de couro', 'botas de couro'];
const TECIDO = ['armadura de tecido', 'elmo de tecido', 'luvas de tecido', 'botas de tecido'];

const SLOTS_POR_CLASSE = {
  novato: { maoPrincipal: ['espada de uma mao', 'adaga'], maoSecundaria: [], armaduras: COURO },
  guerreiro: {
    maoPrincipal: ['espada de uma mao', 'adaga', 'espada de duas maos', 'machado de duas maos', 'lanca de uma mao', 'lanca de duas maos'],
    maoSecundaria: ['escudo'],
    armaduras: ['armadura de metal', 'elmo de metal', 'luvas de metal', 'botas de metal', 'elmo de couro', 'luvas de couro', 'botas de couro'],
  },
  arqueiro: { maoPrincipal: ['arco', 'besta'], maoSecundaria: ['aljava'], armaduras: COURO },
  mago: { maoPrincipal: ['cajado', 'adaga'], maoSecundaria: ['tomo', 'orb'], armaduras: TECIDO },
  feiticeiro: { maoPrincipal: ['cajado', 'adaga'], maoSecundaria: ['tomo', 'orb'], armaduras: TECIDO },
  lutador: { maoPrincipal: ['soqueira', 'tonfa'], maoSecundaria: ['soqueira', 'tonfa'], armaduras: COURO },
  ladino: { maoPrincipal: ['adaga', 'espada de uma mao'], maoSecundaria: ['adaga'], armaduras: COURO },
};

const ARMAS_DUAS_MAOS = ['espada de duas maos', 'machado de duas maos', 'lanca de duas maos'];

function slotsDaClasse(classe) {
  return SLOTS_POR_CLASSE[classe] || SLOTS_POR_CLASSE.novato;
}

module.exports = { SLOTS_POR_CLASSE, ARMAS_DUAS_MAOS, slotsDaClasse };
