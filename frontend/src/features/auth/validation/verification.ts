import type { SessionUser } from '../../../shared/AuthContext';
import { returnPath } from '../../../shared/navigation';
const KEY = 'ttwar.verification.resend';
type TimingStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
function browserStorage(): TimingStorage | undefined { try { return window.sessionStorage; } catch { return undefined; } }
export function normalizeVerificationCode(value: string): string {
  return value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)).replace(/[^0-9]/g, '').slice(0, 5);
}
export function validVerificationEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function rememberResendDeadline(email: string, deadline: number, storage = browserStorage()): void {
  try { storage?.setItem(KEY, JSON.stringify({ email, deadline })); } catch { /* Timing is only a UI hint. */ }
}
export function readResendDeadline(email: string, now = Date.now(), storage = browserStorage()): number {
  try {
    const record = JSON.parse(storage?.getItem(KEY) || 'null');
    if (record?.email === email && typeof record.deadline === 'number' && Number.isFinite(record.deadline) && record.deadline > 0 && record.deadline <= now + 900000) return record.deadline;
  } catch { /* Continue when browser storage is unavailable. */ }
  return now + 60000;
}
export function clearResendDeadline(email: string, storage = browserStorage()): void {
  try { if (JSON.parse(storage?.getItem(KEY) || 'null')?.email === email) storage?.removeItem(KEY); } catch { /* No authentication data is stored here. */ }
}
export function verificationDestination(user: SessionUser, from: unknown): { path: string; state?: { from?: string } } {
  if (user.role === 'admin') return { path: '/admin/dashboard' };
  if (user.role === 'company') return { path: '/admin/company-dashboard' };
  const destination = returnPath({ from });
  return user.hasCompletedQuestions ? { path: destination || '/home' } : { path: '/questions', state: { from: destination } };
}
export function validVerificationReply(value: unknown, email: string): value is { token: string; user: SessionUser } {
  if (!value || typeof value !== 'object' || !('token' in value) || typeof value.token !== 'string' || !value.token.trim() || !('user' in value)) return false;
  const user = value.user;
  return !!user && typeof user === 'object' && '_id' in user && typeof user._id === 'string' && /^[a-f0-9]{24}$/i.test(user._id)
    && 'name' in user && typeof user.name === 'string' && 'email' in user && typeof user.email === 'string' && user.email.trim().toLowerCase() === email
    && 'role' in user && typeof user.role === 'string' && ['seeker', 'company', 'admin'].includes(user.role)
    && 'hasCompletedQuestions' in user && typeof user.hasCompletedQuestions === 'boolean';
}
export function retrySeconds(response: Response, fallback = 60): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(900, Math.ceil(seconds)) : fallback;
}
