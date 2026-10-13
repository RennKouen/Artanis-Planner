import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { getElementColor } from '../data/elements';
import { EFEITOS_PASSIVOS } from '../data/habilidadeEfeitos';

const TIPOS = {
  dano_fisico: 'Dano físico',
  dano_magico: 'Dano mágico',
  dano_distancia: 'Dano à distância',
  debuff_dano: 'Dano + debuff',
  buff_dano: 'Dano + buff',
  debuff: 'Debuff',
  buff: 'Buff',
  cura: 'Cura',
  passiva: 'Passiva',
  passiva_pos_batalha: 'Passiva pós-batalha',
};

// Formata numeros sem casas desnecessarias (1.2 -> "1.2", 2 -> "2.0", 1.25 -> "1.25")
function fmtNum(v) {
  const dois = Math.round(v * 100) / 100;
  return Number.isInteger(dois * 10) ? dois.toFixed(1) : String(dois);
}

// Valores da habilidade em um nivel (1..maxLevel) como [rotulo, texto]
function valoresDoNivel(h, nivel) {
  const i = nivel - 1;
  const pct = (v) => `${Math.round(v * 100)}%`;
  const linhas = [];
  const add = (rotulo, lista, fmt = (v) => v) => {
    const v = lista?.[i];
    if (v) linhas.push([rotulo, fmt(v)]);
  };
  add('MP', h.mpCost);
  add('Multiplicador', h.multiplier, (v) => `${fmtNum(v)}x`);
  const hits = h.numHits?.[i];
  if (hits > 1) linhas.push(['Golpes', hits]);
  add('Penetração de armadura', h.armorPen, pct);
  add('Bônus de DEF', h.defBonus, pct);
  add('Bônus de crítico', h.critBonus, pct);
  add('Veneno', h.poisonDamage);
  add('Cura (% do HP)', h.healPercent, pct);
  const passivo = EFEITOS_PASSIVOS[h.gameId];
  if (passivo) linhas.push(...passivo(nivel));
  return linhas;
}

function BlocoNivel({ titulo, valores }) {
  return (
    <div className="hab-bloco">
      <span className="hab-detalhes-titulo">{titulo}</span>
      {valores.length === 0 && (
        <span className="hab-sem-valores">Sem valores numéricos — veja a descrição.</span>
      )}
      {valores.map(([rotulo, texto]) => (
        <span key={rotulo}>
          {rotulo}: <strong>{texto}</strong>
        </span>
      ))}
    </div>
  );
}

function Requisitos({ requisitos }) {
  if (!requisitos.length) return null;
  return (
    <ul className="hab-requisitos">
      {requisitos.map((r, n) => (
        <li key={n} className={r.ok ? 'ok' : 'falta'}>
          <span>{r.ok ? '✓' : '✗'}</span>
          {r.tipo === 'novato'
            ? `${r.descricao}: ${Math.min(r.atual, r.necessario)}/${r.necessario}`
            : `${r.descricao} nv. ${r.necessario} (atual ${r.atual})`}
        </li>
      ))}
    </ul>
  );
}

function CartaoHabilidade({ h, pontosDisponiveis, onAlterar }) {
  const cor = getElementColor(h.element);
  const aprendida = h.aprendido > 0;
  const noMaximo = h.aprendido >= h.maxLevel;
  const bloqueada = !h.desbloqueada && !aprendida;
  const atual = aprendida ? valoresDoNivel(h, h.aprendido) : null;
  const proximo = noMaximo ? null : valoresDoNivel(h, h.aprendido + 1);

  return (
    <div
      className={`hab-card ${aprendida ? 'aprendida' : ''} ${bloqueada ? 'bloqueada' : ''}`}
      style={aprendida ? { borderColor: cor } : undefined}
    >
      <div className="hab-topo">
        <div>
          <h3 style={{ color: cor }}>{bloqueada && '🔒 '}{h.name}</h3>
          <p className="hab-tipo">{TIPOS[h.type] || h.type} · {h.element}</p>
        </div>
        <div className="hab-controle">
          <button className="btn-secundario" onClick={() => onAlterar(h.id, -1)} disabled={h.aprendido === 0}>−</button>
          <span className="hab-nivel">{h.aprendido}/{h.maxLevel}</span>
          <button
            onClick={() => onAlterar(h.id, 1)}
            disabled={noMaximo || pontosDisponiveis <= 0 || bloqueada}
          >+</button>
        </div>
      </div>

      <div className="hab-pips">
        {Array.from({ length: h.maxLevel }).map((_, n) => (
          <span key={n} className={`hab-pip ${n < h.aprendido ? 'on' : ''}`} style={n < h.aprendido ? { background: cor } : undefined} />
        ))}
      </div>

      <p className="hab-desc">{h.description}</p>

      {!aprendida && <Requisitos requisitos={h.requisitos} />}

      <div className="hab-detalhes">
        {atual ? (
          <BlocoNivel titulo={`Nível atual: ${h.aprendido}`} valores={atual} />
        ) : (
          <span className="hab-detalhes-titulo muted">Não aprendida</span>
        )}
        {proximo ? (
          <BlocoNivel titulo={`Próximo nível: ${h.aprendido + 1}`} valores={proximo} />
        ) : (
          <span className="hab-detalhes-titulo muted">Nível máximo atingido</span>
        )}
      </div>
    </div>
  );
}

export default function AbilitiesPanel({ characterId, level }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/characters/${characterId}/habilidades`);
      setDados(res.data);
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.error || 'Não foi possível carregar as habilidades.');
    }
  }, [characterId]);

  // recarrega quando o nível muda (pode ter resetado habilidades)
  useEffect(() => {
    carregar();
  }, [carregar, level]);

  async function alterar(abilityId, delta) {
    try {
      const res = await api.post(`/characters/${characterId}/habilidades`, { abilityId, delta });
      setDados(res.data);
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao atualizar habilidade.');
    }
  }

  async function resetar() {
    try {
      const res = await api.post(`/characters/${characterId}/resetar-habilidades`);
      setDados(res.data);
    } catch (err) {
      setErro('Erro ao resetar habilidades.');
    }
  }

  if (!dados) {
    return (
      <section className="ficha-card ficha-habilidades">
        <h2>Habilidades</h2>
        <p className="ficha-nota">{erro || 'Carregando habilidades...'}</p>
      </section>
    );
  }

  const { pontos, habilidades } = dados;

  return (
    <section className="ficha-card ficha-habilidades">
      <div className="hab-cabecalho">
        <div>
          <h2>Habilidades</h2>
          <p className="ficha-pontos">
            Pontos de habilidade: <strong>{pontos.disponiveis}</strong>
            <span className="ficha-nota"> · {pontos.total} no total (1 por nível)</span>
          </p>
        </div>
        {pontos.gastos > 0 && (
          <button className="btn-secundario ficha-btn-pequeno" onClick={resetar}>
            Resetar habilidades
          </button>
        )}
      </div>

      {erro && <p className="ficha-aviso">{erro}</p>}

      <div className="hab-novato-info">
        Habilidades de Novato: <strong>{dados.novato.pontos}/{dados.novato.necessario}</strong> pontos
        {dados.novato.pontos >= dados.novato.necessario
          ? ' — habilidades de classe liberadas.'
          : ' — gaste ao menos esses pontos nelas para liberar as habilidades de classe.'}
      </div>

      {[['novato', 'Habilidades de Novato'], ['classe', 'Habilidades de classe']].map(([grupo, titulo]) => {
        const lista = habilidades.filter((h) => h.grupo === grupo);
        if (!lista.length) return null;
        return (
          <div key={grupo}>
            <h3 className="hab-grupo-titulo">{titulo}</h3>
            <div className="hab-grid">
              {lista.map((h) => (
                <CartaoHabilidade key={h.id} h={h} pontosDisponiveis={pontos.disponiveis} onAlterar={alterar} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
