import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../api';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const body = isRegister ? { name, username, email, password } : { email, password };
      const userData = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onLogin(userData);
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="card login-card">
          <h1 className="login-title">InstaSimple</h1>
          <form className="form-stack" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <input
                  className="input"
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </>
            )}
            <input
              className="input"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary">
              {isRegister ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>
          {!isRegister && (
            <p className="muted-text" style={{ marginTop: 14 }}>
              Conta demo: ana@insta.com / 123456
            </p>
          )}
        </div>

        <div className="card switch-card">
          {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button
            type="button"
            className="switch-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Entrar' : 'Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
