import { useState } from 'react';
import { apiRequest, mediaUrl, readImageAsBase64 } from '../api';

export default function Configuracoes({ user, onUpdateUser }) {
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await readImageAsBase64(file);
    setAvatarBase64(base64);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const updated = await apiRequest(`/api/profile/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          username,
          bio,
          avatarBase64: avatarBase64 || undefined,
        }),
      });
      onUpdateUser(updated);
      setAvatarBase64('');
      setMessage('Configurações salvas!');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="page-container">
      <section className="card settings-card">
        <div className="settings-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <img
              src={avatarBase64 || mediaUrl(user.avatar)}
              alt={user.username}
              className="profile-avatar"
              style={{ width: 72, height: 72, marginTop: 0 }}
            />
            <h2>Configurações do perfil</h2>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field-label">
              E-mail da conta
              <input className="input" type="email" value={user.email || ''} readOnly />
            </label>

            <label className="field-label">
              Trocar foto de perfil
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>

            <label className="field-label">
              Nome
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              Nome de usuário
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              Bio
              <textarea
                className="input"
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            <button type="submit" className="btn-primary">
              Salvar alterações
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
