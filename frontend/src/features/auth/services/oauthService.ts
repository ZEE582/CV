import { API_BASE_URL } from "../constants/api";
import { returnPath } from '../../../shared/navigation';

export function oauthStartPath(provider: 'google' | 'github' | 'linkedin', from?: string) {
  const safe = provider === 'google' && from && from.length <= 2048 && !/^\/logout([?#/]|$)/.test(from) ? returnPath({ from }) : undefined;
  return `${API_BASE_URL}/auth/${provider}${safe ? '?' + new URLSearchParams({ from: safe }) : ''}`;
}
export function oauthFailureMessage(code: string | null) {
  if (code === 'google') return 'لم يكتمل الدخول بواسطة Google. حاول مجددًا أو استخدم البريد الإلكتروني.';
  if (code === 'oauth' || code === 'github' || code === 'linkedin') return 'لم يكتمل الدخول بواسطة الحساب الخارجي. حاول مجددًا أو استخدم البريد الإلكتروني.';
  if (code === 'email') return 'تعذر إرسال رمز تأكيد الدخول. حاول بعد قليل أو استخدم البريد الإلكتروني.';
  return '';
}
export function loginWithGoogle(from?: string) {
  window.location.assign(oauthStartPath('google', from));
}

export function loginWithGithub() {
  window.location.assign(oauthStartPath('github'));
}

export function loginWithLinkedin() {
  window.location.assign(oauthStartPath('linkedin'));
}
