const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function apiGetList(path, params) {
  const url = new URL(API_URL + path);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const total = Number(res.headers.get('X-Total-Count') || '0');
  return { data: await res.json(), total };
}

export async function apiCreateBook(bookData) {
  const res = await fetch(`${API_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

export async function apiUpdateBook(id, bookData) {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

export async function apiDeleteBook(id) {
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
}

export async function apiGetStats() {
  const res = await fetch(`${API_URL}/books/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}