import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const CharactersContext = createContext(null);

export function CharactersProvider({ children }) {
  const [personagens, setPersonagens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await api.get('/characters');
      setPersonagens(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function adicionarPersonagem(novo) {
    setPersonagens((prev) => [novo, ...prev]);
  }

  function removerPersonagem(id) {
    setPersonagens((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <CharactersContext.Provider
      value={{ personagens, carregando, carregar, adicionarPersonagem, removerPersonagem }}
    >
      {children}
    </CharactersContext.Provider>
  );
}

export function useCharacters() {
  const ctx = useContext(CharactersContext);
  if (!ctx) throw new Error('useCharacters precisa estar dentro de CharactersProvider');
  return ctx;
}
