export function readMessagesSearch(params: URLSearchParams) {
  const page = Number(params.get('page'));
  return { search: (params.get('q') || '').slice(0, 120), filter: ['true', 'false'].includes(params.get('is_read') || '') ? params.get('is_read')! : 'all', sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest', page: Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1 };
}
export function patchMessagesSearch(previous: URLSearchParams, patch: Record<string, string | number>) {
  const next = new URLSearchParams(previous);
  if ('company' in patch) for (const key of ['job', 'q', 'is_read', 'sort', 'page']) next.delete(key);
  else if (!('page' in patch)) next.delete('page');
  for (const [key, value] of Object.entries(patch)) { if (value === '' || value === 'all' || value === 'newest' || (key === 'page' && Number(value) === 1)) next.delete(key); else next.set(key, String(value)); }
  return next;
}
export function messagesQuery(state: ReturnType<typeof readMessagesSearch>) {
  const query = new URLSearchParams({ page: String(state.page), limit: '20', sort: state.sort });
  if (state.search.trim()) query.set('search', state.search.trim()); if (state.filter !== 'all') query.set('is_read', state.filter); return query;
}
export function messageDate(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Hebron' }).format(date) : 'غير محدد'; }
export function replyLink(email: string, subject?: string | null): string | undefined {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\u0000-\u001f\u007f]/.test(email)) return undefined;
  return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('رد: ' + (subject || 'استفسار').replace(/[\r\n]/g, ' ').slice(0, 200));
}
