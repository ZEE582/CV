import { API_BASE_URL } from '../constants/api';
interface LoginResponse { message?: string; email?: string; requiresVerification?: boolean }
export async function loginUser(email: string, password: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST', credentials: 'include', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data: LoginResponse = await response.json().catch(() => ({}));
  return { response, data };
}
