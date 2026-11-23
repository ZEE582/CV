import { API_BASE_URL } from '../../../shared/api';
import type { Job } from '../types';
export interface JobsSearchResponse { success: true; total: number; page: number; limit: number; pages: number; jobs: Job[] }
export async function searchJobs(params: URLSearchParams, signal?: AbortSignal): Promise<JobsSearchResponse> {
  const response = await fetch(API_BASE_URL + '/jobs?' + params.toString(), { signal, cache: 'no-store' });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 429 ? 'طلبات كثيرة. انتظر قليلًا وأعد المحاولة.' : response.status === 400 ? 'معايير البحث غير صالحة. أعد تعيين الفلاتر.' : 'تعذر تحميل الوظائف. تحقق من الاتصال وأعد المحاولة.');
  if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true || !('jobs' in data) || !Array.isArray(data.jobs)
    || !('total' in data) || !Number.isSafeInteger(data.total) || Number(data.total) < 0 || !('page' in data) || !Number.isSafeInteger(data.page) || Number(data.page) < 1
    || !('limit' in data) || !Number.isSafeInteger(data.limit) || Number(data.limit) < 1 || !('pages' in data) || !Number.isSafeInteger(data.pages) || Number(data.pages) < 1
    || data.jobs.some(job => !job || typeof job._id !== 'string' || typeof job.company_id !== 'string' || typeof job.title !== 'string')) throw new Error('لم نتمكن من قراءة نتائج الوظائف. أعد المحاولة.');
  return data as JobsSearchResponse;
}
