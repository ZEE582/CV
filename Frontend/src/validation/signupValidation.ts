export function validateSignup(
  email: string,
  password: string
): string | null {
  if (!email.trim()) {
    return "يرجى إدخال البريد الإلكتروني";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return "صيغة البريد الإلكتروني غير صحيحة";
  }

  if (!password.trim()) {
    return "يرجى إدخال كلمة المرور";
  }

  if (password.length < 8) {
    return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }

  return null;
}