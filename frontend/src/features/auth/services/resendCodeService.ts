import { API_BASE_URL } from '../constants/api';
export async function resendCode(email: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
    method: 'POST', credentials: 'include', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  return { response, data };
}
