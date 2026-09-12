import { useEffect, useState } from 'react';
import { listarMonstros } from '../services/monsters';
import { getElementColor } from '../data/elements';
import MonsterDetailPanel from '../components/MonsterDetailPanel.jsx';

export default function Bestiary() {
  const [monstros, setMonstros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const data = await listarMonstros();
      setMonstros(data);
      if (data.length > 0) setSelecionadoId(data[0].id);
    } catch (err) {
      setErro('Não foi possível carregar o bestiário. O backend já tem a rota /api/monsters configurada?');
    } finally {
      setCarregando(false);
    }
  }

  const filtrados = monstros.filter((m) =>
    m.name.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionado = monstros.find((m) => m.id === selecionadoId) || null;

  return (
    <div className="bestiary-page">
      <div className="section-header">
        <div>
          <h1 className="page-title">Bestiário</h1>
          <p className="page-subtitle">Consulte os monstros conhecidos de Artanis</p>
        </div>
        <input
          type="text"
          placeholder="Buscar monstro..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-input"
        />
      </div>

      {carregando ? (
        <p className="loading">Carregando bestiário...</p>
      ) : erro ? (
        <div className="empty-state">
          <p>{erro}</p>
        </div>
      ) : (
        <div className="bestiary-layout">
          <div className="bestiary-list-col">
            {filtrados.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum monstro encontrado.</p>
              </div>
            ) : (
              <div className="monster-grid">
                {filtrados.map((m) => (
                  <button
                    key={m.id}
                    className={`monster-card ${m.id === selecionadoId ? 'selected' : ''}`}
                    style={{ '--elem-color': getElementColor(m.element) }}
                    onClick={() => setSelecionadoId(m.id)}
                  >
                    <img
                      src={m.sprite || '/assets/monsters/placeholder.png'}
                      alt={m.name}
                      className="monster-card-sprite"
                    />
                    <p className="monster-card-name">{m.name}</p>
                    <p className="monster-card-level">Nível {m.level}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bestiary-detail-col">
            <MonsterDetailPanel monster={selecionado} />
          </div>
        </div>
      )}
    </div>
  );
}
