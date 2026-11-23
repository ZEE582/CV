export type LoginFieldName = 'email' | 'password';
export type LoginErrors = Partial<Record<LoginFieldName, string>>;
export function validateLoginFields(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = 'أدخل بريدك الإلكتروني.';
  else if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'اكتب بريدًا صحيحًا، مثل name@example.com.';
  // Existing accounts may have older passwords; creation rules do not apply at sign-in.
  if (!password) errors.password = 'أدخل كلمة المرور الخاصة بحسابك.';
  else if (password.length > 128) errors.password = 'كلمة المرور أطول من الحد المسموح (١٢٨ حرفًا).';
  return errors;
}
export function validateLogin(email: string, password: string): string | null {
  const errors = validateLoginFields(email, password);
  return errors.email || errors.password || null;
}
