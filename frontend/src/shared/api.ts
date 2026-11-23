export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('token');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(API_BASE_URL + path, { ...options, headers, credentials: 'include' });
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'تعذر إكمال الطلب');
  return data as T;
}
