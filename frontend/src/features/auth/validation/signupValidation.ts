export interface SignupValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export type SignupFieldName = keyof SignupValues;
export type SignupErrors = Partial<Record<SignupFieldName, string>>;

export function validateSignup(values: SignupValues): SignupErrors {
  const errors: SignupErrors = {};
  const name = values.fullName.trim().replace(/\s+/g, " ");
  const email = values.email.trim();
  if (!name) errors.fullName = "أدخل اسمك الكامل.";
  else if (name.length < 2) errors.fullName = "اكتب اسمًا من حرفين على الأقل.";
  else if (name.length > 200) errors.fullName = "الاسم طويل جدًا. استخدم ٢٠٠ حرف أو أقل.";
  if (!email) errors.email = "أدخل بريدك الإلكتروني.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "اكتب بريدًا صحيحًا، مثل name@example.com.";
  if (!values.password.trim()) errors.password = "اختر كلمة مرور لحسابك.";
  else if (values.password.length < 8) errors.password = "استخدم ٨ أحرف على الأقل.";
  else if (values.password.length > 128) errors.password = "استخدم ١٢٨ حرفًا أو أقل.";
  if (!values.confirmPassword) errors.confirmPassword = "أعد كتابة كلمة المرور للتأكيد.";
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "كلمتا المرور غير متطابقتين.";
  return errors;
}
