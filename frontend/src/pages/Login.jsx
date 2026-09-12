import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('artanis_token', res.data.token);
      localStorage.setItem('artanis_player', JSON.stringify(res.data.player));
      navigate('/personagens');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Mundo de Artanis</h1>
        <p className="subtitle">Planner do Jogador</p>

        <form onSubmit={handleSubmit}>
          <label>Usuário ou email</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="link-secundario">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
