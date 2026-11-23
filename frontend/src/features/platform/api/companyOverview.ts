export interface CompanyOverviewData {
  success: true; company_id: string; generated_at: string;
  jobs: { total: number; open: number; paused: number; expired: number; company_paused: number };
  applications: { total: number; by_status: { pending: number; viewed: number; shortlisted: number; rejected: number; hired: number; other: number } };
  messages: { total: number; read: number; unread: number };
}
export function readCompanyOverview(value: unknown, companyId: string): CompanyOverviewData {
  const error = () => new Error('تعذر تأكيد ملخص الشركة المحددة. أعد تحميل اللوحة.');
  if (!value || typeof value !== 'object') throw error();
  const data = value as Partial<CompanyOverviewData>;
  if (data.success !== true || data.company_id !== companyId || typeof data.generated_at !== 'string' || !Number.isFinite(new Date(data.generated_at).getTime())) throw error();
  function counts(value: unknown, keys: string[], total?: unknown) {
    if (!value || typeof value !== 'object' || keys.some(key => !Number.isSafeInteger((value as Record<string, unknown>)[key]) || Number((value as Record<string, unknown>)[key]) < 0)) throw error();
    if (total !== undefined && keys.reduce((sum, key) => sum + Number((value as Record<string, unknown>)[key]), 0) !== total) throw error();
  }
  counts(data.jobs, ['total']); counts(data.jobs, ['open', 'paused', 'expired', 'company_paused'], data.jobs!.total);
  counts(data.applications, ['total']); counts(data.applications?.by_status, ['pending', 'viewed', 'shortlisted', 'rejected', 'hired', 'other'], data.applications!.total);
  counts(data.messages, ['total']); counts(data.messages, ['read', 'unread'], data.messages!.total);
  return data as CompanyOverviewData;
}
