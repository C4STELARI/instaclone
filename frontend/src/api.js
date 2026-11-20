const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) {
    return path;
  }
  return API_URL + path;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(API_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Resposta inválida do servidor' };
    }
  }

  if (!response.ok) {
    throw new Error(
      data.error || 'Erro ao conectar com o servidor. Verifique se o backend está rodando.'
    );
  }

  return data;
}

export function readImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler imagem'));
    reader.readAsDataURL(file);
  });
}
