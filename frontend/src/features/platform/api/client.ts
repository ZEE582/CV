import type { JobsResponse, CompaniesResponse, CompanyResponse, Job } from '../types';

import { apiFetch } from '../../../shared/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

function toQS(p?: Record<string, string | number>) {
  if (!p) return '';
  return '?' + new URLSearchParams(Object.fromEntries(Object.entries(p).map(([k,v]) => [k, String(v)])));
}

export const jobsApi = {
  list: (p?: Record<string, string | number>) => req<JobsResponse>('GET', `/jobs${toQS(p)}`),
  get:  (id: string) => req<{ success: boolean; job: Job }>('GET', `/jobs/${id}`),
};

export const companiesApi = {
  list: (p?: Record<string, string>) => req<CompaniesResponse>('GET', `/companies${toQS(p)}`),
  get:  (id: string) => req<CompanyResponse>('GET', `/companies/${id}`),
};
