export const applicationStatuses = { pending: 'قيد الانتظار', viewed: 'تمت المراجعة', shortlisted: 'ضمن القائمة المختصرة', rejected: 'مرفوض', hired: 'تم التوظيف' };
export type ApplicationStatus = keyof typeof applicationStatuses;
export interface ApplicationRecord {
  cv_file?: import('./cvFiles').CvFileMetadata | null;
  has_job_snapshot?: boolean; snapshot_title?: string | null; snapshot_company_name?: string | null;
  _id: string; __v?: number; updatedAt?: string; status: ApplicationStatus; createdAt: string; cover_letter?: string | null; cv_url?: string | null;
  user_id: { _id: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  job_id: { _id: string; title: string; is_active: boolean } | string | null;
  company_id: { _id: string; name_ar: string } | string | null;
}
export function safeDocumentUrl(value?: string | null) { try { const url = new URL(value || ''); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
