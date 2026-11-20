import { NavLink, useNavigate } from 'react-router';

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/feed" className="brand">
          InstaSimple
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/feed" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Feed
          </NavLink>
          <NavLink to="/perfil" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Perfil
          </NavLink>
          <NavLink
            to="/configuracoes"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Configurações
          </NavLink>
          <button type="button" className="btn-link" onClick={handleLogout}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
