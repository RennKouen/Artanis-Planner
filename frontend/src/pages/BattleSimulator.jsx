import { useEffect, useState } from 'react';
import { useCharacters } from '../context/CharactersContext.jsx';
import { listarMonstros } from '../services/monsters';
import { listarItens } from '../services/items';
import { simularBatalha, carregarRestricoes } from '../services/simulations';
import { getClasseInfo } from '../data/classes';
import '../simulador.css';

const SLOTS = [
  { id: 'maoPrincipal', nome: 'Mão primária', type: 'armas', vazio: 'Mãos nuas' },
  { id: 'maoSecundaria', nome: 'Mão secundária', type: 'armas', vazio: 'Vazia' },
  { id: 'armadura', nome: 'Armadura', type: 'armaduras', prefixo: 'armadura' },
  { id: 'elmo', nome: 'Elmo', type: 'armaduras', prefixo: 'elmo' },
  { id: 'botas', nome: 'Botas', type: 'armaduras', prefixo: 'botas' },
  { id: 'luvas', nome: 'Luvas', type: 'armaduras', prefixo: 'luvas' },
  { id: 'acessorio1', nome: 'Acessório 1', type: 'acessorios' },
  { id: 'acessorio2', nome: 'Acessório 2', type: 'acessorios' },
];

const RESULTADO = {
  vitoria: { texto: 'Vitória', classe: 'vitoria' },
  derrota: { texto: 'Derrota', classe: 'derrota' },
  empate: { texto: 'Empate (limite de turnos)', classe: 'empate' },
};

const pct = (v) => `${Math.round(v * 100)}%`;

export default function BattleSimulator() {
  const { personagens } = useCharacters();
  const [monstros, setMonstros] = useState([]);
  const [itensPorTipo, setItensPorTipo] = useState({});
  const [erroCarga, setErroCarga] = useState('');

  const [personagemId, setPersonagemId] = useState('');
  const [monstroId, setMonstroId] = useState('');
  const [equip, setEquip] = useState({});
  const [restricoes, setRestricoes] = useState(null);
  const [estrategia, setEstrategia] = useState('habilidades');
  const [runs, setRuns] = useState(1);

  const [simulando, setSimulando] = useState(false);
  const [erro, setErro] = useState('');
  const [resposta, setResposta] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, armas, armaduras, acessorios] = await Promise.all([
          listarMonstros(), listarItens({ type: 'armas' }), listarItens({ type: 'armaduras' }),
          listarItens({ type: 'acessorios' }),
        ]);
        setMonstros(m);
        setItensPorTipo({ armas, armaduras, acessorios });
        setRestricoes(await carregarRestricoes());
      } catch (err) {
        setErroCarga('Não foi possível carregar monstros e itens. O backend e o seed de itens estão ok?');
      }
    })();
  }, []);

  useEffect(() => {
    if (!personagemId && personagens.length > 0) setPersonagemId(String(personagens[0].id));
  }, [personagens, personagemId]);

  async function simular(e) {
    e.preventDefault();
    setErro('');
    if (!personagemId || !monstroId) {
      setErro('Escolha um personagem e um monstro.');
      return;
    }
    setSimulando(true);
    try {
      const data = await simularBatalha({
        characterId: Number(personagemId),
        monsterId: Number(monstroId),
        equip: Object.fromEntries(Object.entries(equip).filter(([, v]) => v).map(([k, v]) => [k, Number(v)])),
        strategy: estrategia,
        runs: Number(runs),
      });
      setResposta(data);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao simular a batalha.');
    } finally {
      setSimulando(false);
    }
  }

  const personagem = personagens.find((p) => String(p.id) === personagemId);
  const classeJogo = personagem ? personagem.class : 'novato';
  const cfg = restricoes ? restricoes.classes[classeJogo] || restricoes.classes.novato : null;
  const duasMaos = !!cfg && restricoes.duasMaos.some((s) => {
    const main = (itensPorTipo.armas || []).find((i) => String(i.id) === String(equip.maoPrincipal));
    return main && main.subcategory === s;
  });

  // permitido para a classe? (mesma regra do backend)
  function permitido(sl, item) {
    if (!cfg) return true;
    if (sl.id === 'maoPrincipal') return cfg.maoPrincipal.includes(item.subcategory);
    if (sl.id === 'maoSecundaria') return cfg.maoSecundaria.includes(item.subcategory);
    if (sl.prefixo) return item.subcategory.startsWith(sl.prefixo) && cfg.armaduras.includes(item.subcategory);
    return true;
  }

  // ao trocar de personagem/arma, limpa o que deixou de valer
  useEffect(() => {
    if (!cfg) return;
    setEquip((atual) => {
      const novo = { ...atual };
      let mudou = false;
      for (const sl of SLOTS) {
        const it = (itensPorTipo[sl.type] || []).find((i) => String(i.id) === String(atual[sl.id]));
        if (atual[sl.id] && (!it || !permitido(sl, it) || (sl.id === 'maoSecundaria' && duasMaos))) {
          novo[sl.id] = ''; mudou = true;
        }
      }
      return mudou ? novo : atual;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personagemId, restricoes, duasMaos]);

  return (
    <div className="sim">
      <div className="section-header">
        <div>
          <h1 className="page-title">Simulação de Batalha</h1>
          <p className="page-subtitle">Teste sua build contra qualquer monstro do bestiário</p>
        </div>
      </div>

      {erroCarga && <p className="ficha-aviso">{erroCarga}</p>}

      <form className="ficha-card sim-form" onSubmit={simular}>
        <div className="sim-campos">
          <label>
            Personagem
            <select value={personagemId} onChange={(e) => setPersonagemId(e.target.value)}>
              {personagens.length === 0 && <option value="">Nenhum personagem criado</option>}
              {personagens.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {getClasseInfo(p.class).nome} nv. {p.level}
                </option>
              ))}
            </select>
          </label>

          <label>
            Monstro
            <select value={monstroId} onChange={(e) => setMonstroId(e.target.value)}>
              <option value="">Escolha um monstro...</option>
              {monstros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (nv. {m.level}{m.isBoss ? ', chefe' : ''}) — {m.element}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estratégia
            <select value={estrategia} onChange={(e) => setEstrategia(e.target.value)}>
              <option value="habilidades">Usar habilidades de dano aprendidas</option>
              <option value="basico">Apenas ataque básico</option>
            </select>
          </label>

          <label>
            Simulações
            <select value={runs} onChange={(e) => setRuns(e.target.value)}>
              <option value={1}>1 batalha (com log)</option>
              <option value={100}>100 batalhas (taxa de vitória)</option>
              <option value={1000}>1000 batalhas (taxa de vitória)</option>
            </select>
          </label>
        </div>

        <h3 className="sim-subtitulo">Equipamento</h3>
        <div className="sim-campos">
          {SLOTS.map((sl) => {
            const bloqueado = sl.id === 'maoSecundaria' && (duasMaos || (cfg && cfg.maoSecundaria.length === 0));
            const lista = (itensPorTipo[sl.type] || []).filter((i) => permitido(sl, i));
            return (
              <label key={sl.id}>
                {sl.nome}
                <select value={equip[sl.id] || ''} disabled={bloqueado} onChange={(e) => setEquip({ ...equip, [sl.id]: e.target.value })}>
                  <option value="">{bloqueado ? (duasMaos ? 'Ocupada (arma de duas mãos)' : 'Indisponível para a classe') : sl.vazio || 'Nenhum'}</option>
                  {lista.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} — {i.subcategory} (tier {i.tier})</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        <div className="sim-acoes">
          <button type="submit" disabled={simulando || personagens.length === 0}>
            {simulando ? 'Simulando...' : 'Simular batalha'}
          </button>
          {personagem && <span className="ficha-nota">Usa os atributos e habilidades atuais de {personagem.name}.</span>}
        </div>
        {erro && <p className="ficha-aviso">{erro}</p>}
      </form>

      {resposta && <Resultado r={resposta} />}

      <p className="ficha-nota sim-nota">
        Cobertura: ataque básico e habilidades de dano do jogador, acerto, esquiva, defesa, crítico,
        elementos, veneno e roubo de vida, com o ataque básico do monstro. Buffs, debuffs, curas,
        consumíveis e habilidades de monstros ainda não são simulados.
      </p>
    </div>
  );
}

function Resultado({ r }) {
  const b = r.batalha;
  const res = RESULTADO[b.resultado];
  const j = r.jogador;
  const m = r.monstro;

  return (
    <div className="sim-resultado">
      <div className={`sim-banner ${res.classe}`}>
        <strong>{res.texto}</strong>
        <span>
          {b.acoes} ações · dano causado {b.danoCausado} · dano recebido {b.danoRecebido} ·
          HP final {b.hpJogador}/{j.hpMax}
          {b.resultado === 'vitoria' && ` · +${r.recompensa.exp} EXP · +${r.recompensa.zeny} zeny`}
        </span>
      </div>

      {r.estatisticas && (
        <div className="ficha-card sim-stats">
          <h2>Estatísticas ({r.estatisticas.runs} batalhas)</h2>
          <div className="sim-stats-grid">
            <div><span>Taxa de vitória</span><strong>{pct(r.estatisticas.taxaVitoria)}</strong></div>
            <div><span>Vitórias</span><strong>{r.estatisticas.vitorias}</strong></div>
            <div><span>Derrotas</span><strong>{r.estatisticas.derrotas}</strong></div>
            <div><span>Ações em média</span><strong>{r.estatisticas.mediaAcoes}</strong></div>
            <div><span>HP restante (vitórias)</span><strong>{pct(r.estatisticas.hpMedioNasVitorias)}</strong></div>
          </div>
        </div>
      )}

      <div className="sim-lados">
        <div className="ficha-card">
          <h2>{j.nome}{r.arma ? ` — ${r.arma}` : ''}</h2>
          <ul className="sim-lista">
            <li>HP <strong>{j.hpMax}</strong></li>
            <li>MP <strong>{j.mpMax}</strong></li>
            <li>{j.usaDistancia ? 'ATK à distância' : 'ATK físico'} <strong>{j.usaDistancia ? j.atkR : j.atkF}</strong></li>
            <li>ATK mágico <strong>{j.atkM}</strong></li>
            <li>DEF física / mágica <strong>{j.defF} / {j.defM}</strong></li>
            <li>Precisão / Esquiva <strong>{j.precisao} / {j.esquiva}</strong></li>
            <li>Velocidade <strong>{j.velocidade}</strong></li>
            <li>Crítico <strong>{pct(j.chanceCritico)}</strong></li>
            <li>Elemento do ataque <strong>{j.elementoAtk}</strong></li>
            {j.elementoDef !== 'neutro' && <li>Elemento da armadura <strong>{j.elementoDef} (nv. {j.nivelElementoDef})</strong></li>}
            <li>Habilidades de dano <strong>{r.habilidadesUsaveis}</strong></li>
          </ul>
        </div>
        <div className="ficha-card">
          <h2>{m.nome}</h2>
          <ul className="sim-lista">
            <li>HP <strong>{m.hpMax}</strong></li>
            <li>ATK <strong>{m.atk}</strong></li>
            <li>DEF física <strong>{m.defF}</strong></li>
            <li>Precisão / Esquiva <strong>{m.precisao} / {m.esquiva}</strong></li>
            <li>Velocidade <strong>{Math.round(m.velocidade * 10) / 10}</strong></li>
            <li>Crítico <strong>{pct(m.chanceCritico)}</strong></li>
            <li>Elemento <strong>{m.element} (nv. {m.elementLevel})</strong></li>
          </ul>
        </div>
      </div>

      <div className="ficha-card">
        <h2>Log da batalha{r.estatisticas ? ' (primeira simulação)' : ''}</h2>
        <div className="sim-log">
          {b.log.map((l, n) => (
            <div key={n} className={`sim-log-linha ${l.tipo}`}>
              <span className="sim-log-turno">{l.turno > 0 ? `#${l.turno}` : '—'}</span>
              <span className="sim-log-texto">{l.texto}</span>
              <span className="sim-log-hp">HP {l.hpJ} · {m.nome} {l.hpM}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
