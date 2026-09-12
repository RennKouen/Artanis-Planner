import { useState } from 'react';
import { CLASSES } from '../data/classes';
import api from '../services/api';

export default function CreateCharacterModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [classe, setClasse] = useState('guerreiro');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/characters', { name, class: classe });
      onCreated(res.data.character);
      onClose();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar personagem.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Criar Personagem</h2>

        <form onSubmit={handleSubmit}>
          <label>Nome do personagem</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Artanis"
            minLength={2}
            required
          />

          <label>Classe</label>
          <div className="classes-grid">
            {CLASSES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`classe-card ${classe === c.id ? 'selecionada' : ''}`}
                style={{ borderColor: classe === c.id ? c.cor : 'transparent' }}
                onClick={() => setClasse(c.id)}
              >
                <span className="classe-icone">{c.icone}</span>
                <span>{c.nome}</span>
              </button>
            ))}
          </div>

          <div className="status-preview">
            <p className="status-preview-titulo">Status iniciais (nível 1)</p>
            <div className="status-grid">
              <span>STR 3</span>
              <span>AGI 3</span>
              <span>INT 3</span>
              <span>DEX 3</span>
              <span>VIT 3</span>
              <span>LUK 3</span>
              <span>HP 100</span>
              <span>MP 100</span>
            </div>
          </div>

          {erro && <p className="erro">{erro}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={carregando}>
              {carregando ? 'Criando...' : 'Criar Personagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
