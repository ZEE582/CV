import { applicationStatuses, type ApplicationStatus } from './recruitment';
import { readApplicationHistory, type ApplicationHistory } from './applicationHistory';
import { readApplicationJobDetails, type SavedApplicationJob } from './applicationJobDetails';
import { isCvFileMetadata, type CvFileMetadata } from './cvFiles';
export interface ApplicationReport {
  application_id: string; generated_at: string; job_id: string | null; company_id: string | null;
  title: string; company_name: string; names_source: 'saved' | 'current' | 'unavailable';
  application: { _id: string; status: ApplicationStatus; version: number; submitted_at: string; cover_letter: string | null; cv_url: string | null; cv_file?: CvFileMetadata };
  snapshot: SavedApplicationJob | null; history: ApplicationHistory;
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function readApplicationReport(data: Record<string, unknown>, applicationId: string): ApplicationReport {
  const invalid = () => new Error('تعذر التحقق من نسخة الطلب. أغلق المعاينة وأعد تحميل الطلبات.');
  const record = data.application;
  if (object(record) && record.cv_file != null && !isCvFileMetadata(record.cv_file)) throw invalid();
  if (data.success !== true || data.application_id !== applicationId || typeof data.generated_at !== 'string' || !Number.isFinite(Date.parse(data.generated_at))
    || !object(record) || record._id !== applicationId || typeof record.status !== 'string' || !Object.hasOwn(applicationStatuses, record.status)
    || !Number.isSafeInteger(record.version) || Number(record.version) < 0 || typeof record.submitted_at !== 'string' || !Number.isFinite(Date.parse(record.submitted_at))
    || ['cover_letter', 'cv_url'].some(key => record[key] !== null && typeof record[key] !== 'string')
    || typeof data.title !== 'string' || typeof data.company_name !== 'string' || typeof data.names_source !== 'string' || !['saved', 'current', 'unavailable'].includes(data.names_source)
    || ['job_id', 'company_id'].some(key => data[key] !== null && (typeof data[key] !== 'string' || !data[key])) || !object(data.history)) throw invalid();
  const history = readApplicationHistory(data.history, applicationId);
  if (history.status !== record.status || history.version !== record.version || Date.parse(history.submitted_at) !== Date.parse(record.submitted_at)) throw invalid();
  let snapshot: SavedApplicationJob | null = null;
  if (data.snapshot != null) {
    if (!data.job_id || !data.company_id) throw invalid();
    snapshot = readApplicationJobDetails({ ...data, job: null, company: null }, applicationId, String(data.job_id), String(data.company_id)).snapshot || null;
    if (data.names_source !== 'saved' || data.title !== snapshot?.job.title || data.company_name !== snapshot.company.name_ar) throw invalid();
  } else if (data.names_source === 'saved') throw invalid();
  return { application_id: applicationId, generated_at: data.generated_at, job_id: data.job_id as string | null, company_id: data.company_id as string | null,
    title: data.title, company_name: data.company_name, names_source: data.names_source as ApplicationReport['names_source'],
    application: { _id: applicationId, status: record.status as ApplicationStatus, version: Number(record.version), submitted_at: record.submitted_at, cover_letter: record.cover_letter as string | null, cv_url: record.cv_url as string | null, ...(record.cv_file ? { cv_file: { name: (record.cv_file as CvFileMetadata).name, size: (record.cv_file as CvFileMetadata).size } } : {}) }, snapshot, history };
}
