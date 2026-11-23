export type RecoveryFieldName = 'email' | 'code' | 'password' | 'confirmation';
export interface RecoveryValues { email: string; code: string; password: string; confirmation: string }
export type RecoveryErrors = Partial<Record<RecoveryFieldName, string>>;
const KEY = 'ttwar.recovery.resend';
type TimingStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
function browserStorage(): TimingStorage | undefined { try { return window.sessionStorage; } catch { return undefined; } }
export function normalizeRecoveryCode(value: string): string {
  return value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)).replace(/[^0-9]/g, '').slice(0, 6);
}
export function validRecoveryEmail(email: string): boolean { return email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
export function validateRecovery(values: RecoveryValues, resetting: boolean): RecoveryErrors {
  const errors: RecoveryErrors = {};
  if (!values.email.trim()) errors.email = 'أدخل بريدك الإلكتروني.';
  else if (!validRecoveryEmail(values.email)) errors.email = 'اكتب بريدًا صحيحًا، مثل name@example.com.';
  if (!resetting) return errors;
  if (!/^[0-9]{6}$/.test(values.code)) errors.code = 'أدخل رمز الاستعادة كاملًا، المكوّن من ٦ أرقام.';
  if (values.password.length < 8 || !/\S/.test(values.password)) errors.password = 'استخدم كلمة مرور من ٨ أحرف على الأقل.';
  else if (new TextEncoder().encode(values.password).length > 72) errors.password = 'كلمة المرور طويلة جدًا. استخدم كلمة أقصر.';
  if (!values.confirmation) errors.confirmation = 'أعد كتابة كلمة المرور الجديدة.';
  else if (values.password !== values.confirmation) errors.confirmation = 'كلمتا المرور غير متطابقتين.';
  return errors;
}
export function rememberRecoveryDeadline(email: string, deadline: number, storage = browserStorage()): void {
  try { storage?.setItem(KEY, JSON.stringify({ email, deadline })); } catch { /* Timing is only a UI hint. */ }
}
export function recoveryDeadline(email: string, now = Date.now(), storage = browserStorage()): number {
  try {
    const record = JSON.parse(storage?.getItem(KEY) || 'null');
    if (record?.email === email && typeof record.deadline === 'number' && Number.isFinite(record.deadline) && record.deadline > 0 && record.deadline <= now + 900000) return record.deadline;
  } catch { /* Server limits still apply when browser storage is blocked. */ }
  return 0;
}
export function clearRecoveryDeadline(email: string, storage = browserStorage()): void {
  try { if (JSON.parse(storage?.getItem(KEY) || 'null')?.email === email) storage?.removeItem(KEY); } catch { /* No credentials are stored here. */ }
}
