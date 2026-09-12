import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getClasseInfo } from '../data/classes';
import CreateCharacterModal from '../components/CreateCharacterModal.jsx';

export default function Characters() {
  const [personagens, setPersonagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const navigate = useNavigate();

  const player = JSON.parse(localStorage.getItem('artanis_player') || '{}');

  useEffect(() => {
    carregarPersonagens();
  }, []);

  async function carregarPersonagens() {
    setCarregando(true);
    try {
      const res = await api.get('/characters');
      setPersonagens(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function excluirPersonagem(id) {
    if (!confirm('Tem certeza que deseja excluir este personagem?')) return;
    try {
      await api.delete(`/characters/${id}`);
      setPersonagens((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    localStorage.removeItem('artanis_token');
    localStorage.removeItem('artanis_player');
    navigate('/login');
  }

  function handleCreated(novoPersonagem) {
    setPersonagens((prev) => [novoPersonagem, ...prev]);
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Mundo de Artanis</h1>
          <p className="subtitle">Olá, {player.username}</p>
        </div>
        <button className="btn-secundario" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <div className="section-header">
        <h2>Meus Personagens</h2>
        <button onClick={() => setModalAberto(true)}>+ Criar Personagem</button>
      </div>

      {carregando ? (
        <p className="loading">Carregando personagens...</p>
      ) : personagens.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não criou nenhum personagem.</p>
          <button onClick={() => setModalAberto(true)}>Criar meu primeiro personagem</button>
        </div>
      ) : (
        <div className="characters-grid">
          {personagens.map((p) => {
            const info = getClasseInfo(p.class);
            return (
              <div className="character-card" key={p.id} style={{ borderColor: info.cor }}>
                <div className="character-card-header" style={{ background: info.cor }}>
                  <span className="classe-icone">{info.icone}</span>
                  <span>{info.nome}</span>
                </div>
                <div className="character-card-body">
                  <h3>{p.name}</h3>
                  <p className="nivel">Nível {p.level}</p>
                  <div className="status-grid-small">
                    <span>STR {p.str_base}</span>
                    <span>AGI {p.agi_base}</span>
                    <span>INT {p.int_base}</span>
                    <span>DEX {p.dex_base}</span>
                    <span>VIT {p.vit_base}</span>
                    <span>LUK {p.luk_base}</span>
                  </div>
                  <div className="hp-mp-row">
                    <span>❤️ {p.hp_base}</span>
                    <span>💧 {p.mp_base}</span>
                  </div>
                  <button className="btn-excluir" onClick={() => excluirPersonagem(p.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <CreateCharacterModal
          onClose={() => setModalAberto(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
