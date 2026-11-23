import { API_BASE_URL } from '../constants/api';
export async function verifyCode(email: string, code: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
    method: 'POST', credentials: 'include', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  return { response, data };
}
