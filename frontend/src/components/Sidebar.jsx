import { NavLink, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/personagens', label: 'Personagens', icon: 'user' },
  { to: '/bestiario',   label: 'Bestiário',   icon: 'skull' },
];

const NAV_FUTURO = [
  { label: 'Itens',              icon: 'bag' },
  { label: 'Habilidades',        icon: 'spark' },
  { label: 'Simulação de Batalha', icon: 'sword' },
];

const ICONS = {
  user:  <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" />,
  skull: <path d="M12 2C7 2 3 6 3 11c0 3 1.5 5 3 6.3V21h3v-2h6v2h3v-3.7c1.5-1.3 3-3.3 3-6.3 0-5-4-9-9-9zM9 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />,
  bag:   <path d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />,
  spark: <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />,
  sword: <path d="M14.5 2L22 9.5 15 16l-2-2 4-4-1.5-1.5-4 4-2-2zM2 22l7-7 2 2-7 7z" />,
};

export default function Sidebar() {
  const navigate = useNavigate();
  const player = JSON.parse(localStorage.getItem('artanis_player') || '{}');

  function handleLogout() {
    localStorage.removeItem('artanis_token');
    localStorage.removeItem('artanis_player');
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">A</span>
        <div>
          <p className="sidebar-brand-title">Mundo de Artanis</p>
          <p className="sidebar-brand-subtitle">Planner do Jogador</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" className="sidebar-icon">{ICONS[item.icon]}</svg>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <p className="sidebar-section-label">Em breve</p>
        {NAV_FUTURO.map((item) => (
          <div key={item.label} className="sidebar-link disabled">
            <svg viewBox="0 0 24 24" className="sidebar-icon">{ICONS[item.icon]}</svg>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-account">
        <div className="sidebar-account-info">
          <p className="sidebar-account-name">{player.username}</p>
          <p className="sidebar-account-email">{player.email}</p>
        </div>
        <button className="btn-secundario btn-sair" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </aside>
  );
}
