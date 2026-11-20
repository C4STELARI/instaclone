import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest, mediaUrl } from '../api';

export default function Perfil({ user }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    apiRequest(`/api/profile/${user.id}`).then((data) => {
      setProfile(data.user);
      setPosts(data.posts);
    });
  }, [user.id]);

  if (!profile) {
    return <main className="page-container">Carregando perfil...</main>;
  }

  return (
    <main className="page-container">
      <section className="card profile-card">
        <div className="profile-body" style={{ paddingTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <img
              src={mediaUrl(profile.avatar)}
              alt={profile.username}
              className="profile-avatar"
              style={{ marginTop: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div className="profile-top">
                <div>
                  <h2>{profile.name}</h2>
                  <p className="muted-text">@{profile.username}</p>
                </div>
                <Link to="/configuracoes" className="btn-secondary">
                  Editar perfil
                </Link>
              </div>
              {profile.bio && <p style={{ marginTop: 8 }}>{profile.bio}</p>}
              <div className="profile-stats">
                <span>
                  <strong>{posts.length}</strong> publicações
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="muted-text">Você ainda não fez nenhuma publicação.</p>
      ) : (
        <section className="profile-grid">
          {posts.map((post) => (
            <div key={post.id} className="grid-item">
              <img src={mediaUrl(post.imageUrl)} alt={post.caption || 'Foto do perfil'} />
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
