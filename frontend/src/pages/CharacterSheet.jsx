import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { getClasseInfo } from '../data/classes';
import { useCharacters } from '../context/CharactersContext.jsx';
import { calcularDerivados, ATRIBUTOS } from '../data/derivedStats';
import AbilitiesPanel from '../components/AbilitiesPanel.jsx';
import '../ficha.css';

function Barra({ cor }) {
  return (
    <div className="ficha-barra">
      <div className="ficha-barra-fill" style={{ width: '100%', background: cor }} />
    </div>
  );
}

// Valor derivado com prévia (+N / −N) quando há pontos ainda não confirmados
function Delta({ atual, previa, sufixo = '' }) {
  const diff = Math.round((previa - atual) * 100) / 100;
  if (diff === 0) return null;
  return (
    <em className={`ficha-delta ${diff > 0 ? 'up' : 'down'}`}>
      {diff > 0 ? '+' : ''}{sufixo === '%' ? Math.round(diff * 100) : diff}{sufixo}
    </em>
  );
}

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { carregar, removerPersonagem } = useCharacters();

  const [ficha, setFicha] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [rascunho, setRascunho] = useState({});
  const [nivelInput, setNivelInput] = useState('');
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const carregarFicha = useCallback(async () => {
    try {
      const res = await api.get(`/characters/${id}`);
      setFicha(res.data);
      setNivelInput(String(res.data.level));
      setRascunho({});
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível carregar o personagem.');
    }
  }, [id]);

  useEffect(() => {
    carregarFicha();
  }, [carregarFicha]);

  if (erro) {
    return (
      <div className="empty-state">
        <p>{erro}</p>
        <p className="empty-state-hint"><Link to="/personagens">Voltar para personagens</Link></p>
      </div>
    );
  }
  if (!ficha) return <p className="loading">Carregando ficha...</p>;

  const info = getClasseInfo(ficha.class);
  const d = ficha.derivados;
  const gastos = Object.values(rascunho).reduce((a, b) => a + b, 0);
  const pontosRestantes = ficha.pontos_disponiveis - gastos;
  const pontosGastosTotal = ['str', 'agi', 'int', 'dex', 'vit', 'luk']
    .reduce((s, a) => s + (ficha[`${a}_base`] - 3), 0);

  // Prévia: derivados com os pontos ainda não confirmados
  const previa = calcularDerivados({
    hp_base: ficha.hp_base,
    mp_base: ficha.mp_base,
    str: ficha.str_base + (rascunho.str || 0),
    agi: ficha.agi_base + (rascunho.agi || 0),
    int: ficha.int_base + (rascunho.int || 0),
    dex: ficha.dex_base + (rascunho.dex || 0),
    vit: ficha.vit_base + (rascunho.vit || 0),
    luk: ficha.luk_base + (rascunho.luk || 0),
  });

  function mudarRascunho(attr, delta) {
    setRascunho((prev) => {
      const atual = prev[attr] || 0;
      const novo = atual + delta;
      if (novo < 0) return prev;
      if (delta > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [attr]: novo };
    });
  }

  async function confirmarPontos() {
    setAviso('');
    try {
      const res = await api.post(`/characters/${ficha.id}/atributos`, rascunho);
      setFicha(res.data);
      setRascunho({});
      carregar();
      setAviso('Pontos distribuídos.');
    } catch (err) {
      setAviso(err.response?.data?.error || 'Erro ao distribuir pontos.');
    }
  }

  async function resetarAtributos() {
    if (!confirm('Devolver todos os pontos de atributo distribuídos?')) return;
    try {
      const res = await api.post(`/characters/${ficha.id}/resetar-atributos`);
      setFicha(res.data);
      setRascunho({});
      carregar();
      setAviso('Atributos resetados.');
    } catch (err) {
      setAviso('Erro ao resetar atributos.');
    }
  }

  async function definirNivel(e) {
    e.preventDefault();
    setAviso('');
    const level = parseInt(nivelInput, 10);
    if (!level || level < 1 || level > ficha.nivelMaximo) {
      setAviso(`Informe um nível entre 1 e ${ficha.nivelMaximo}.`);
      return;
    }
    try {
      const res = await api.post(`/characters/${ficha.id}/nivel`, { level });
      setFicha(res.data.character);
      setNivelInput(String(res.data.character.level));
      setRascunho({});
      carregar();
      const extras = [];
      if (res.data.resetouAtributos) extras.push('atributos resetados');
      if (res.data.resetouHabilidades) extras.push('habilidades resetadas');
      setAviso(
        `Nível ${level} definido.` +
        (extras.length ? ` Os pontos gastos não cabiam no novo nível: ${extras.join(' e ')}.` : '')
      );
    } catch (err) {
      setAviso(err.response?.data?.error || 'Erro ao definir nível.');
    }
  }

  async function salvarNome(e) {
    e.preventDefault();
    setAviso('');
    try {
      const res = await api.put(`/characters/${ficha.id}`, { name: novoNome });
      setFicha(res.data);
      setEditandoNome(false);
      carregar();
    } catch (err) {
      setAviso(err.response?.data?.error || 'Erro ao renomear.');
    }
  }

  async function excluir() {
    if (!confirm(`Excluir ${ficha.name}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/characters/${ficha.id}`);
      removerPersonagem(ficha.id);
      navigate('/personagens');
    } catch (err) {
      setAviso('Erro ao excluir personagem.');
    }
  }

  const derivados = [
    ['ATK físico', 'atkFisico'],
    ['ATK à distância', 'atkDistancia'],
    ['ATK mágico', 'atkMagico'],
    ['DEF física', 'defFisica'],
    ['DEF mágica', 'defMagica'],
    ['Precisão', 'precisao'],
    ['Esquiva', 'esquiva'],
    ['Velocidade', 'velocidade'],
  ];

  return (
    <div className="ficha">
      <Link to="/personagens" className="ficha-voltar">← Personagens</Link>

      <div className="ficha-topo" style={{ borderColor: info.cor }}>
        <div className="ficha-sprite" style={{ background: info.cor }}>
          <img src={info.sprite} alt={info.nome} />
        </div>
        <div className="ficha-identidade">
          {editandoNome ? (
            <form onSubmit={salvarNome} className="ficha-nome-form">
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} maxLength={50} autoFocus />
              <button type="submit">Salvar</button>
              <button type="button" className="btn-secundario" onClick={() => setEditandoNome(false)}>Cancelar</button>
            </form>
          ) : (
            <div className="ficha-nome-linha">
              <h1 className="page-title ficha-nome">{ficha.name}</h1>
              <button
                className="btn-secundario ficha-btn-pequeno"
                onClick={() => { setNovoNome(ficha.name); setEditandoNome(true); }}
              >
                Renomear
              </button>
            </div>
          )}
          <p className="ficha-classe" style={{ color: info.cor }}>
            {info.nome} · Nível {ficha.level} <span className="ficha-nota">(máx. {ficha.nivelMaximo})</span>
          </p>

          <form onSubmit={definirNivel} className="ficha-nivel-form">
            <label htmlFor="nivel">Definir nível</label>
            <input
              id="nivel"
              type="number"
              min="1"
              max={ficha.nivelMaximo}
              value={nivelInput}
              onChange={(e) => setNivelInput(e.target.value)}
            />
            <button type="submit">Aplicar</button>
          </form>
          <p className="ficha-nota">
            Cada nível: +5 HP, +2 MP, +3 pontos de atributo e +1 ponto de habilidade.
            Reduzir o nível pode resetar atributos e habilidades.
          </p>
          <p className="ficha-zeny">Zeny: {ficha.zeny}</p>
        </div>
      </div>

      {aviso && <p className="ficha-aviso">{aviso}</p>}

      <div className="ficha-colunas">
        <section className="ficha-card">
          <h2>Atributos</h2>
          <p className="ficha-pontos">
            Pontos disponíveis: <strong>{pontosRestantes}</strong>
          </p>
          <div className="ficha-attrs">
            {ATRIBUTOS.map((a) => {
              const extra = rascunho[a.id] || 0;
              return (
                <div className="ficha-attr" key={a.id}>
                  <span className="ficha-attr-nome">{a.rotulo}</span>
                  <span className="ficha-attr-valor">
                    {ficha[`${a.id}_base`] + extra}
                    {extra > 0 && <em> (+{extra})</em>}
                  </span>
                  <div className="ficha-attr-botoes">
                    <button className="btn-secundario" onClick={() => mudarRascunho(a.id, -1)} disabled={extra === 0}>−</button>
                    <button onClick={() => mudarRascunho(a.id, 1)} disabled={pontosRestantes <= 0}>+</button>
                  </div>
                  <div className="ficha-tooltip" role="tooltip">
                    <strong>{a.nome}</strong>
                    <span className="ficha-tooltip-sub">Cada ponto adiciona:</span>
                    <ul>
                      {a.efeitos.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ficha-confirmar">
            {gastos > 0 && (
              <>
                <button onClick={confirmarPontos}>Confirmar distribuição ({gastos})</button>
                <button className="btn-secundario" onClick={() => setRascunho({})}>Descartar</button>
              </>
            )}
            {gastos === 0 && pontosGastosTotal > 0 && (
              <button className="btn-secundario" onClick={resetarAtributos}>Resetar atributos</button>
            )}
          </div>
        </section>

        <section className="ficha-card">
          <h2>Atributos derivados</h2>
          <div className="ficha-vitais">
            <div>
              <div className="ficha-exp-rotulo">
                <span>❤️ HP máximo</span>
                <span>{previa.hpMax} <Delta atual={d.hpMax} previa={previa.hpMax} /></span>
              </div>
              <Barra cor="var(--hp)" />
            </div>
            <div>
              <div className="ficha-exp-rotulo">
                <span>💧 MP máximo</span>
                <span>{previa.mpMax} <Delta atual={d.mpMax} previa={previa.mpMax} /></span>
              </div>
              <Barra cor="var(--mp)" />
            </div>
          </div>
          <div className="ficha-derivados">
            {derivados.map(([rotulo, chave]) => (
              <div className="ficha-derivado" key={chave}>
                <span>{rotulo}</span>
                <strong>
                  {previa[chave]} <Delta atual={d[chave]} previa={previa[chave]} />
                </strong>
              </div>
            ))}
            <div className="ficha-derivado">
              <span>Chance de crítico</span>
              <strong>
                {Math.round(previa.chanceCritico * 100)}%{' '}
                <Delta atual={d.chanceCritico} previa={previa.chanceCritico} sufixo="%" />
              </strong>
            </div>
            <div className="ficha-derivado">
              <span>Dano crítico</span>
              <strong>{Math.round(previa.danoCritico * 100)}%</strong>
            </div>
          </div>
          <p className="ficha-nota">
            {gastos > 0
              ? 'Prévia: os valores em destaque mudam quando você confirmar a distribuição.'
              : 'Valores calculados com os atributos base, sem equipamentos.'}
          </p>
        </section>
      </div>

      <AbilitiesPanel characterId={ficha.id} level={ficha.level} />

      <div className="ficha-rodape">
        <button className="btn-excluir ficha-excluir" onClick={excluir}>Excluir personagem</button>
      </div>
    </div>
  );
}
