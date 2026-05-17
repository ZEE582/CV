import type { JobsResponse, CompaniesResponse, CompanyResponse, Job } from '../types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export async function sendContactMessage(data: {
  company_id: string; sender_name: string; sender_email: string;
  sender_phone?: string; subject?: string; message: string;
}) {
  return req('POST', '/messages', data);
}

export async function sendAiMessage(message: string, jobsList: Job[] = []): Promise<string> {
  if (!message.trim()) throw new Error('الرسالة مطلوبة');
  const data = await req<{ success: boolean; reply: string }>('POST', '/ai/chat', { message: message.trim(), jobsList });
  if (!data.success || !data.reply) throw new Error('لم يتم استلام رد');
  return data.reply;
}
