export interface ContactDraft { name: string; email: string; phone: string; subject: string; message: string }
export const emptyContact: ContactDraft = { name: '', email: '', phone: '', subject: 'استفسار', message: '' };
export function contactPayload(companyId: string, draft: ContactDraft) {
  return { company_id: companyId, sender_name: draft.name.trim(), sender_email: draft.email.trim().toLowerCase(), sender_phone: draft.phone.trim(), subject: draft.subject.trim() || 'استفسار', message: draft.message.trim() };
}
export function contactErrors(draft: ContactDraft): Partial<Record<keyof ContactDraft, string>> {
  const errors: Partial<Record<keyof ContactDraft, string>> = {};
  if (draft.name.trim().length < 2 || draft.name.trim().length > 200) errors.name = 'اكتب اسمًا بين حرفين و200 حرف.';
  if (draft.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = 'اكتب بريدًا إلكترونيًا صالحًا.';
  if (draft.phone.trim().length > 40) errors.phone = 'رقم الهاتف أطول من 40 حرفًا.';
  if (draft.subject.trim().length > 200) errors.subject = 'الموضوع أطول من 200 حرف.';
  if (draft.message.trim().length < 10 || draft.message.trim().length > 5000) errors.message = 'اكتب رسالة بين 10 و5000 حرف.';
  return errors;
}
