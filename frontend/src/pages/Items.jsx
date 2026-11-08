import { useEffect, useState } from 'react';
import { listarItens } from '../services/items';
import '../simulador.css';

const TIPOS = [
  { id: '', rotulo: 'Todos' },
  { id: 'armas', rotulo: 'Armas' },
  { id: 'armaduras', rotulo: 'Armaduras' },
  { id: 'acessorios', rotulo: 'Acessórios' },
  { id: 'consumiveis', rotulo: 'Consumíveis' },
  { id: 'etc', rotulo: 'Materiais' },
];

const ROTULOS_ATRIBUTO = {
  atk_f: 'ATK físico', atk_r: 'ATK distância', atk_m: 'ATK mágico',
  def_f: 'DEF física', def_m: 'DEF mágica',
  str: 'STR', agi: 'AGI', int: 'INT', dex: 'DEX', vit: 'VIT', luk: 'LUK',
  precisao: 'Precisão', chance_critico: 'Crítico', dano_critico: 'Dano crítico',
  elemento_atk: 'Elemento (ataque)', elemento_def: 'Elemento (defesa)',
  nivel_elemento_atk: 'Nível elem. ataque', nivel_elemento_def: 'Nível elem. defesa',
  recuperacao_hp: 'Recupera HP', recuperacao_mp: 'Recupera MP',
  cura_hp_percentual: 'Cura HP (%)', cura_mp_percentual: 'Cura MP (%)',
  duracao_turnos: 'Duração (turnos)', batalhas: 'Batalhas',
  bonus_xp_pct: 'Bônus EXP', bonus_atk_batalha: 'Bônus ATK (batalha)',
  bonus_def_batalha: 'Bônus DEF (batalha)', bonus_atk_m_batalha: 'Bônus ATK mágico (batalha)',
  bonus_critico_batalha: 'Bônus crítico (batalha)', bonus_esquiva_batalha: 'Bônus esquiva (batalha)',
  bonus_vel_batalha: 'Bônus velocidade (batalha)',
};

function formatarValor(chave, valor) {
  if (typeof valor === 'number' && valor > 0 && valor < 1) return `${Math.round(valor * 100)}%`;
  return String(valor);
}

export default function Items() {
  const [itens, setItens] = useState([]);
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setItens(await listarItens());
      } catch (err) {
        setErro('Não foi possível carregar os itens. O banco de itens já foi importado (seed_items.sql)?');
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const filtrados = itens.filter(
    (i) => (!tipo || i.type === tipo) && i.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="page-title">Itens</h1>
          <p className="page-subtitle">Equipamentos, consumíveis e materiais do jogo</p>
        </div>
        <input
          type="text"
          placeholder="Buscar item..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-input"
        />
      </div>

      <div className="itens-filtros">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            className={`itens-filtro ${tipo === t.id ? 'ativo' : ''}`}
            onClick={() => setTipo(t.id)}
          >
            {t.rotulo}
          </button>
        ))}
        <span className="ficha-nota">{filtrados.length} itens</span>
      </div>

      {carregando ? (
        <p className="loading">Carregando itens...</p>
      ) : erro ? (
        <div className="empty-state"><p>{erro}</p></div>
      ) : (
        <div className="itens-lista">
          {filtrados.map((i) => {
            const attrs = Object.entries(i.attributes || {}).filter(([k]) => k !== 'tier');
            return (
              <div className="item-linha" key={i.id}>
                <button className="item-cabecalho" onClick={() => setAberto(aberto === i.id ? null : i.id)}>
                  <span className="item-nome">{i.name}</span>
                  <span className="item-sub">{i.subcategory}</span>
                  <span className="item-tier">Tier {i.tier}</span>
                  <span className="item-preco">{i.buyPrice} z</span>
                </button>
                {attrs.length > 0 && (
                  <div className="item-attrs">
                    {attrs.map(([k, v]) => (
                      <span key={k}>{ROTULOS_ATRIBUTO[k] || k}: <strong>{formatarValor(k, v)}</strong></span>
                    ))}
                  </div>
                )}
                {aberto === i.id && (
                  <div className="item-detalhe">
                    {i.lore && <p>{i.lore}</p>}
                    <p className="ficha-nota">Compra: {i.buyPrice} z · Venda: {i.sellPrice} z</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
