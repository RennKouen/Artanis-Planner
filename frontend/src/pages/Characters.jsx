import { useCharacters } from '../context/CharactersContext.jsx';
import { getClasseInfo } from '../data/classes';
import api from '../services/api';

export default function Characters() {
  const { personagens, carregando, removerPersonagem } = useCharacters();

  async function excluirPersonagem(id) {
    if (!confirm('Tem certeza que deseja excluir este personagem?')) return;
    try {
      await api.delete(`/characters/${id}`);
      removerPersonagem(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="page-title">Personagens</h1>
          <p className="page-subtitle">Gerencie os personagens desta conta</p>
        </div>
      </div>

      {carregando ? (
        <p className="loading">Carregando personagens...</p>
      ) : personagens.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não criou nenhum personagem.</p>
          <p className="empty-state-hint">Use o botão "+ Personagem" no topo da tela para criar o primeiro.</p>
        </div>
      ) : (
        <div className="characters-grid">
          {personagens.map((p) => {
            const info = getClasseInfo(p.class);
            return (
              <div className="character-card" key={p.id} style={{ borderColor: info.cor }}>
                <div className="character-card-header" style={{ background: info.cor }}>
                  <span>{info.nome}</span>
                </div>
                <div className="character-card-sprite-wrap">
                  <img src={info.sprite} alt={info.nome} className="character-card-sprite" />
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
    </div>
  );
}
