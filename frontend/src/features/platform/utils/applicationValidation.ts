import { MAX_CV_BYTES } from '../api/cvFiles';
export interface ApplicationDraft { cover: string; cvUrl: string; cvFile?: File | null }
export type ApplicationErrors = Partial<Record<keyof ApplicationDraft, string>>;
export function validateApplication(form: ApplicationDraft): ApplicationErrors {
  const errors: ApplicationErrors = {};
  if (form.cvFile) {
    if (!/\.pdf$/i.test(form.cvFile.name) || (form.cvFile.type && form.cvFile.type !== 'application/pdf')) errors.cvFile = 'اختر ملف PDF فقط.';
    else if (!form.cvFile.size || form.cvFile.size > MAX_CV_BYTES) errors.cvFile = 'اختر ملفًا غير فارغ بحجم لا يتجاوز 5 ميغابايت.';
    if (form.cvUrl.trim()) errors.cvUrl = 'اختر ملف السيرة أو رابطها، ولا ترسلهما معًا.';
  }
  if (form.cover.trim().length > 10000) errors.cover = 'استخدم ١٠٠٠٠ حرف أو أقل لرسالة التقديم.';
  if (form.cvUrl.trim()) {
    try { const url = new URL(form.cvUrl.trim()); if (!['http:', 'https:'].includes(url.protocol) || form.cvUrl.trim().length > 2048) errors.cvUrl = 'أدخل رابط سيرة يبدأ بـ http أو https، بطول ٢٠٤٨ حرفًا أو أقل.'; }
    catch { errors.cvUrl = 'أدخل رابط سيرة صالحًا، أو اترك الحقل فارغًا.'; }
  }
  return errors;
}
export function applicationPayload(jobId: string, draft: ApplicationDraft) { return { job_id: jobId, cover_letter: draft.cover.trim(), ...(draft.cvUrl.trim() ? { cv_url: draft.cvUrl.trim() } : {}) }; }
