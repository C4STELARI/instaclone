import { useEffect, useState } from 'react';
import { apiRequest, mediaUrl, readImageAsBase64 } from '../api';

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/posts')
      .then(setPosts)
      .catch((err) => setError(err.message));
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await readImageAsBase64(file);
    setImageBase64(base64);
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    setError('');
    if (!imageBase64) {
      setError('Escolha uma imagem para publicar');
      return;
    }

    try {
      const created = await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, imageBase64, caption }),
      });
      setPosts([created, ...posts]);
      setCaption('');
      setImageBase64('');
      e.target.reset();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLike(postId) {
    const data = await apiRequest(`/api/posts/${postId}/like`, { method: 'POST' });
    setPosts(posts.map((p) => (p.id === postId ? { ...p, likes: data.likes } : p)));
  }

  async function handleDelete(postId) {
    await apiRequest(`/api/posts/${postId}`, { method: 'DELETE' });
    setPosts(posts.filter((p) => p.id !== postId));
  }

  return (
    <main className="page-container">
      <div className="feed-layout">
        <section className="card card-body">
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>Nova publicação</h2>
          <form className="form-stack" onSubmit={handleCreatePost}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {imageBase64 && <img src={imageBase64} alt="Prévia" className="preview-image" />}
            <input
              className="input"
              type="text"
              placeholder="Escreva uma legenda..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary">
              Publicar
            </button>
          </form>
        </section>

        {posts.map((post) => (
          <article key={post.id} className="card">
            <div className="post-header">
              <div className="post-author">
                <img
                  src={mediaUrl(post.authorAvatar)}
                  alt={post.authorUsername}
                  className="avatar-sm"
                />
                <strong>@{post.authorUsername}</strong>
              </div>
              {post.userId === user.id && (
                <button type="button" className="btn-link" onClick={() => handleDelete(post.id)}>
                  Excluir
                </button>
              )}
            </div>

            <img
              src={mediaUrl(post.imageUrl)}
              alt={post.caption || 'Publicação'}
              className="post-image"
            />

            <div className="post-content">
              <div className="post-actions">
                <button type="button" className="like-btn" onClick={() => handleLike(post.id)}>
                  ♥ Curtir ({post.likes})
                </button>
              </div>

              {post.caption && (
                <p>
                  <strong>@{post.authorUsername}</strong> {post.caption}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
