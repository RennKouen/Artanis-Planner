import { useState } from 'react';
import { useCharacters } from '../context/CharactersContext.jsx';
import { getClasseInfo } from '../data/classes';
import CreateCharacterModal from './CreateCharacterModal.jsx';

export default function TopBar() {
  const { personagens, carregando, adicionarPersonagem } = useCharacters();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-chips">
        {carregando ? (
          <p className="topbar-loading">Carregando personagens...</p>
        ) : personagens.length === 0 ? (
          <p className="topbar-loading">Nenhum personagem criado ainda.</p>
        ) : (
          personagens.map((p) => {
            const info = getClasseInfo(p.class);
            return (
              <div className="topbar-chip" key={p.id} style={{ borderColor: info.cor }}>
                <img src={info.sprite} alt={info.nome} className="topbar-chip-sprite" />
                <div className="topbar-chip-text">
                  <span className="topbar-chip-name">{p.name}</span>
                  <span className="topbar-chip-meta">Nível {p.level} · {info.nome}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="btn-topbar-add" onClick={() => setModalAberto(true)}>
        + Personagem
      </button>

      {modalAberto && (
        <CreateCharacterModal
          onClose={() => setModalAberto(false)}
          onCreated={adicionarPersonagem}
        />
      )}
    </header>
  );
}
