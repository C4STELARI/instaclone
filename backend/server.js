import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3001;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DB_PATH = IS_VERCEL
  ? '/tmp/database.sqlite'
  : path.join(__dirname, 'data', 'database.sqlite');
const STATIC_UPLOADS_DIR = path.join(__dirname, 'uploads');
const WRITE_UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : STATIC_UPLOADS_DIR;

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

if (!fs.existsSync(WRITE_UPLOADS_DIR)) {
  fs.mkdirSync(WRITE_UPLOADS_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '/uploads/avatar-default.svg'
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    caption TEXT DEFAULT '',
    likes INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const userCount = db.prepare('SELECT COUNT(*) as total FROM users').get();
if (userCount.total === 0) {
  db.prepare(
    'INSERT INTO users (id, name, username, email, passwordHash, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'u-ana',
    'Ana Silva',
    'anasilva',
    'ana@insta.com',
    hashPassword('123456'),
    'Fotografia, café e código.',
    '/uploads/ana-avatar.webp'
  );

  db.prepare(
    'INSERT INTO posts (id, userId, imageUrl, caption, likes, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    'p-1',
    'u-ana',
    '/uploads/sample-1.svg',
    'Fim de tarde incrível!',
    2,
    '2026-11-17T12:00:00.000Z'
  );

  db.prepare(
    'INSERT INTO posts (id, userId, imageUrl, caption, likes, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    'p-2',
    'u-ana',
    '/uploads/sample-2.svg',
    'Trilha de hoje.',
    1,
    '2026-11-17T11:00:00.000Z'
  );
}

function saveImage(base64) {
  if (!base64 || !base64.startsWith('data:image/')) {
    return null;
  }
  const parts = base64.split(',');
  const ext = parts[0].split('/')[1].split(';')[0].replace('svg+xml', 'svg');
  const filename = crypto.randomUUID() + '.' + ext;
  fs.writeFileSync(path.join(WRITE_UPLOADS_DIR, filename), Buffer.from(parts[1], 'base64'));
  return '/uploads/' + filename;
}

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(WRITE_UPLOADS_DIR));
app.use('/uploads', express.static(STATIC_UPLOADS_DIR));

app.post('/api/register', (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  const exists = db
    .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);

  if (exists) {
    return res.status(409).json({ error: 'E-mail ou usuário já cadastrado' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    bio: '',
    avatar: '/uploads/avatar-default.svg',
  };

  db.prepare(
    'INSERT INTO users (id, name, username, email, passwordHash, bio, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    newUser.id,
    newUser.name,
    newUser.username,
    newUser.email,
    hashPassword(password),
    newUser.bio,
    newUser.avatar
  );

  res.status(201).json(newUser);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db
    .prepare(
      'SELECT id, name, username, email, bio, avatar FROM users WHERE email = ? AND passwordHash = ?'
    )
    .get(email || '', hashPassword(password || ''));

  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos' });
  }

  res.json(user);
});

app.get('/api/posts', (req, res) => {
  const list = db
    .prepare(
      `SELECT posts.id, posts.userId, posts.imageUrl, posts.caption, posts.likes,
              users.username as authorUsername, users.avatar as authorAvatar
       FROM posts
       LEFT JOIN users ON posts.userId = users.id
       ORDER BY posts.createdAt DESC`
    )
    .all();

  res.json(list);
});

app.post('/api/posts', (req, res) => {
  const { userId, imageBase64, caption } = req.body;
  const imageUrl = saveImage(imageBase64);
  if (!imageUrl) {
    return res.status(400).json({ error: 'Escolha uma imagem' });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    'INSERT INTO posts (id, userId, imageUrl, caption, likes, createdAt) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(id, userId, imageUrl, caption || '', createdAt);

  const author = db.prepare('SELECT username, avatar FROM users WHERE id = ?').get(userId);

  res.status(201).json({
    id,
    userId,
    imageUrl,
    caption: caption || '',
    likes: 0,
    authorUsername: author ? author.username : 'usuario',
    authorAvatar: author ? author.avatar : '/uploads/avatar-default.svg',
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const post = db.prepare('SELECT id, likes FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Publicação não encontrada' });
  }

  const likes = post.likes + 1;
  db.prepare('UPDATE posts SET likes = ? WHERE id = ?').run(likes, req.params.id);
  res.json({ likes });
});

app.delete('/api/posts/:id', (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/profile/:userId', (req, res) => {
  const user = db
    .prepare('SELECT id, name, username, email, bio, avatar FROM users WHERE id = ?')
    .get(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const posts = db
    .prepare('SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC')
    .all(user.id);

  res.json({ user, posts });
});

app.put('/api/profile/:userId', (req, res) => {
  const { name, username, bio, avatarBase64 } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const newName = name || user.name;
  const newUsername = username || user.username;
  const newBio = bio !== undefined ? bio : user.bio;
  const newAvatar = avatarBase64 ? saveImage(avatarBase64) || user.avatar : user.avatar;

  db.prepare('UPDATE users SET name = ?, username = ?, bio = ?, avatar = ? WHERE id = ?').run(
    newName,
    newUsername,
    newBio,
    newAvatar,
    user.id
  );

  res.json({
    id: user.id,
    name: newName,
    username: newUsername,
    email: user.email,
    bio: newBio,
    avatar: newAvatar,
  });
});

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log('Servidor rodando em http://localhost:' + PORT);
  });
}

export default app;
