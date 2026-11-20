import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Perfil from './pages/Perfil';
import Configuracoes from './pages/Configuracoes';

function loadUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
}

export default function App() {
  const [user, setUser] = useState(loadUser);

  function saveUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={saveUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Navbar onLogout={logout} />
      <Routes>
        <Route path="/feed" element={<Feed user={user} />} />
        <Route path="/perfil" element={<Perfil user={user} />} />
        <Route
          path="/configuracoes"
          element={<Configuracoes user={user} onUpdateUser={saveUser} />}
        />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  );
}
