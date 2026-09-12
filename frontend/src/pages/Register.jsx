import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('artanis_token', res.data.token);
      localStorage.setItem('artanis_player', JSON.stringify(res.data.player));
      navigate('/personagens');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Mundo de Artanis</h1>
        <p className="subtitle">Criar Conta</p>

        <form onSubmit={handleSubmit}>
          <label>Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {erro && <p className="erro">{erro}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>

        <p className="link-secundario">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
