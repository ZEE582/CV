import { uniqueLanguages } from './languages';
import { normalizeQuestionAge, questionsFromProfile } from './questionsValidation';
import type { QuestionsForm } from '../types/questions';
import type { ProfileUpdate, UserProfile } from '../types/user';
export interface ProfileDraft extends QuestionsForm { avatar: string; phone: string }
export function profileDraft(user: UserProfile): ProfileDraft {
  return { ...questionsFromProfile(user), avatar: typeof user.avatar === 'string' && user.avatar ? user.avatar : typeof user.avatar_url === 'string' ? user.avatar_url : '', phone: typeof user.phone === 'string' ? user.phone : '' };
}
export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;
export function profileErrors(form: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!form.fullName.trim() || form.fullName.trim().length > 200) errors.fullName = 'أدخل اسمًا من حرف واحد إلى ٢٠٠ حرف.';
  const age = normalizeQuestionAge(form.age);
  if (age && (!/^[0-9]{1,3}$/.test(age) || Number(age) < 1 || Number(age) > 150)) errors.age = 'أدخل عمرًا صحيحًا بين ١ و١٥٠، أو اتركه فارغًا.';
  if (form.phone.trim().length > 40) errors.phone = 'استخدم ٤٠ حرفًا أو أقل لرقم الهاتف.';
  if (form.avatar.trim()) {
    try { const url = new URL(form.avatar.trim()); if (!['http:', 'https:'].includes(url.protocol) || form.avatar.trim().length > 2000) errors.avatar = 'أدخل رابط صورة يبدأ بـ http أو https، بطول ٢٠٠٠ حرف أو أقل.'; }
    catch { errors.avatar = 'أدخل رابط صورة صالحًا، أو اتركه فارغًا.'; }
  }
  for (const [key, limit] of [['city', 100], ['university', 200], ['major', 200], ['jobTitle', 300], ['experienceYears', 100], ['jobInterest', 300]] as const) if (form[key].trim().length > limit) errors[key] = `استخدم ${limit} حرفًا أو أقل.`;
  if (form.programmingLanguages.length > 50 || form.programmingLanguages.some(value => !value.trim() || value.trim().length > 80)) errors.programmingLanguages = 'راجع أسماء اللغات. الحد الأقصى ٥٠ لغة و٨٠ حرفًا لكل اسم.';
  return errors;
}
export function validateProfile(form: ProfileDraft): string { return Object.values(profileErrors(form))[0] || ''; }
export function profilePayload(form: ProfileDraft): ProfileUpdate {
  const fullName = form.fullName.trim(); const age = normalizeQuestionAge(form.age);
  return { name: fullName, avatar: form.avatar.trim(), phone: form.phone.trim(), onboardingData: {
    fullName, age: age ? Number(age) : null, city: form.city.trim(), university: form.university.trim(), major: form.major.trim(),
    jobTitle: form.jobTitle.trim(), experienceYears: form.experienceYears.trim(), lookingForJob: form.lookingForJob, jobInterest: form.jobInterest.trim(),
    programmingLanguages: uniqueLanguages(form.programmingLanguages),
  } };
}
export function validateNewPassword(password: string, confirmation: string): string {
  if (password.length < 8 || !/\S/.test(password)) return 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل';
  if (new TextEncoder().encode(password).length > 72) return 'كلمة المرور الجديدة طويلة جدًا؛ الحد 72 بايت';
  if (password !== confirmation) return 'تأكيد كلمة المرور غير مطابق';
  return '';
}
export function validatePassword(current: string, password: string, confirmation: string): string {
  if (!current) return 'أدخل كلمة المرور الحالية';
  if (password === current) return 'اختر كلمة مرور مختلفة عن الحالية';
  return validateNewPassword(password, confirmation);
}
