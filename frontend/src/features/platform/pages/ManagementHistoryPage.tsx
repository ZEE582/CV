import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography, useTheme } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/AuthContext';
import { createHistoryFeedClient, type HistoryFeedClient, type HistoryFeedResult } from '../api/historyFeed';
import { historyActions, historyQuery, patchHistorySearch, readHistorySearch, validHistoryDay } from '../utils/historyFeed';
import { HistoryEventItem } from '../components/management/HistoryButton';
import HistoryExportDialog from '../components/management/HistoryExportDialog';
import { createHistoryExportSnapshot, type HistoryExportSnapshot } from '../utils/historyPageExport';

export default function ManagementHistoryPage() { const { user } = useAuth(); return user?.role === 'admin' ? <HistoryWorkspace key={user._id} accountId={user._id} role={user.role} /> : <Alert severity="warning">سجل الإدارة متاح للمدير فقط.</Alert>; }
export function HistoryWorkspace({ accountId, role, clientOverride }: { accountId: string; role: string; clientOverride?: HistoryFeedClient }) {
  const theme = useTheme();
  const [client] = useState(() => clientOverride || createHistoryFeedClient(accountId, role)); const [params, setParams] = useSearchParams(); const filters = useMemo(() => readHistorySearch(params), [params]); const query = historyQuery(filters).toString();
  const [read, setRead] = useState<{ query: string; data: HistoryFeedResult | null; error: string; loading: boolean }>({ query: '', data: null, error: '', loading: true }); const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState<{ snapshot: HistoryExportSnapshot; source: HistoryFeedResult } | null>(null); const [exportError, setExportError] = useState('');
  const idError = [filters.actor_id, filters.target_id].some(value => !!value && !/^[a-f\d]{24}$/.test(value)); const invalidDate = [filters.from, filters.to].some(value => !!value && !validHistoryDay(value)); const dateError = invalidDate || !!(filters.from && filters.to && filters.from > filters.to);
  useEffect(() => {
    if (idError || dateError) { setRead({ query, data: null, loading: false, error: idError ? 'أكمل المعرّف من 24 خانة بالأحرف والأرقام الصحيحة.' : invalidDate ? 'أدخل تاريخًا صحيحًا من 1900 إلى 2199.' : 'تاريخ البداية يجب أن يسبق تاريخ النهاية أو يساويه.' }); return; }
    const controller = new AbortController(); setRead({ query, data: null, error: '', loading: true });
    const timer = window.setTimeout(() => { void client.list(new URLSearchParams(query), controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (data.out_of_range) { setParams(previous => historyQuery(readHistorySearch(previous)).toString() === query ? patchHistorySearch(previous, { page: data.pages }) : previous, { replace: true }); return; }
      setRead({ query, data, error: '', loading: false });
    }).catch(failure => { if (!controller.signal.aborted) setRead({ query, data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل سجل الإدارة.' }); }); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, query, retry, idError, dateError, invalidDate, setParams]);
  const loading = read.query !== query || read.loading; const data = read.query === query ? read.data : null; const error = read.query === query ? read.error : '';
  function change(patch: Record<string, string | number>) { setParams(previous => patchHistorySearch(previous, patch), { replace: 'q' in patch || 'actor_id' in patch || 'target_id' in patch }); }
  function refresh() { setRead({ query, data: null, error: '', loading: true }); setRetry(value => value + 1); }
  function exportPage() { setExportError(''); if (!data || loading || error || !client.isCurrent()) { setExportError('حدّث النتائج وتحقق من الجلسة قبل التصدير.'); return; } try { setExporting({ snapshot: createHistoryExportSnapshot(data, new URLSearchParams(query)), source: data }); } catch { setExportError('تعذر تجهيز نسخة صالحة من الصفحة. حدّث النتائج وحاول مجددًا.'); } }
  return <Box dir="rtl" sx={{ m: { xs: 2, md: 4 }, minWidth: 0, fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root,& .MuiInputBase-root,& .MuiInputLabel-root,& .MuiButton-root,& .MuiChip-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& input[type="date"]': { colorScheme: theme.palette.mode }, '& .MuiTypography-body1': { fontSize: 14, lineHeight: 1.9 } }}>
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap"><Typography component="h1" variant="h3" fontWeight={800}>سجل الإدارة</Typography><Box display="flex" gap={1} flexWrap="wrap"><Button color="inherit" variant="outlined" disabled={loading || idError || dateError} onClick={refresh}>تحديث النتائج</Button><Button color="secondary" variant="contained" disabled={loading || !!error || !data?.items.length || !client.isCurrent()} onClick={exportPage}>تصدير الصفحة المحمّلة</Button></Box></Box>
    {exportError && <Alert severity="error" sx={{ mt: 2 }}>{exportError}</Alert>}
    <Typography color="text.secondary" mt={1} mb={2}>راجع عمليات الحسابات والشركات المحفوظة في مكان واحد. هذا العرض يجمع آخر 100 عملية لكل سجل منذ تفعيل الميزة، ولا يشمل العمليات الأقدم.</Typography>
    <Typography color="text.secondary" mb={3}>الأسماء المعروضة حالية. التواريخ والفلاتر والأوقات هنا بالتوقيت العالمي (UTC).</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>
      <TextField label="اسم الحساب أو الشركة" placeholder="بحث حرفي بالاسم الحالي" value={filters.search} inputProps={{ maxLength: 120 }} onChange={event => change({ q: event.target.value })} />
      <TextField select SelectProps={{ native: true }} label="نوع السجل" value={filters.kind} onChange={event => change({ kind: event.target.value })}><option value="all">الحسابات والشركات</option><option value="account">الحسابات</option><option value="company">الشركات</option></TextField>
      <TextField select SelectProps={{ native: true }} label="العملية" value={filters.action} onChange={event => change({ action: event.target.value })}><option value="all">كل العمليات</option>{Object.entries(historyActions).filter(([action]) => filters.kind === 'all' || action.startsWith(filters.kind + '.')).map(([action, label]) => <option key={action} value={action}>{label}</option>)}</TextField>
      <TextField type="date" label="من تاريخ" InputLabelProps={{ shrink: true }} value={filters.from} error={dateError} inputProps={{ min: '1900-01-01', max: '2199-12-31' }} onChange={event => change({ from: event.target.value })} />
      <TextField type="date" label="إلى تاريخ" InputLabelProps={{ shrink: true }} value={filters.to} error={dateError} inputProps={{ min: '1900-01-01', max: '2199-12-31' }} onChange={event => change({ to: event.target.value })} />
      <Button color="inherit" onClick={() => setParams(new URLSearchParams())}>مسح البحث والتصفية</Button>
    </Box>
    <Box component="details" sx={{ my: 2 }}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>فلاتر المعرّفات</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2,minmax(0,1fr))' }, gap: 2, mt: 1 }}>
      <TextField label="معرّف المنفّذ (اختياري)" value={filters.actor_id} error={!!filters.actor_id && !/^[a-f\d]{24}$/.test(filters.actor_id)} inputProps={{ dir: 'ltr', maxLength: 24 }} onChange={event => change({ actor_id: event.target.value })} />
      <TextField label="معرّف الحساب أو الشركة (اختياري)" value={filters.target_id} error={!!filters.target_id && !/^[a-f\d]{24}$/.test(filters.target_id)} inputProps={{ dir: 'ltr', maxLength: 24 }} onChange={event => change({ target_id: event.target.value })} />
    </Box></Box>
    {error && <Alert severity="error">{error}{!idError && !dateError && <Button color="inherit" onClick={refresh}>إعادة المحاولة</Button>}</Alert>}
    <Typography role="status" my={2} color="text.secondary">{loading ? 'جارٍ تحميل العمليات المحفوظة…' : data && !error ? `${data.total} نتيجة من العمليات المحفوظة · الصفحة ${data.page} من ${data.pages}` : ''}</Typography>
    {!loading && !error && data && (data.items.length ? <>
      <Box component="ol" sx={{ p: 0, m: 0 }}>{data.items.map(item => <HistoryEventItem key={item.kind + ':' + item.target_id + ':' + item.event.revision} event={item.event} timeZone="UTC" subject={<Box mb={1.5}><Box display="flex" gap={1} alignItems="center" flexWrap="wrap"><Chip size="small" variant="outlined" label={item.kind === 'account' ? 'حساب' : 'شركة'} /><Typography component="h2" sx={{ fontSize: 18, fontWeight: 800, overflowWrap: 'anywhere' }}>{item.target_name || 'اسم غير متاح'}</Typography></Box><Typography color="text.secondary" sx={{ fontSize: 12, overflowWrap: 'anywhere' }}>معرّف السجل: <bdi>{item.target_id}</bdi></Typography><Button size="small" color="inherit" onClick={() => change({ kind: item.kind, target_id: item.target_id, action: 'all', q: '' })}>حصر النتائج بهذا السجل</Button></Box>} />)}</Box>
      {data.pages > 1 && <Box component="nav" aria-label="صفحات سجل الإدارة" display="flex" justifyContent="center" alignItems="center" flexWrap="wrap" gap={2} mt={3}><Button color="inherit" disabled={data.page <= 1} onClick={() => change({ page: data.page - 1 })}>السابق</Button><Typography>{data.page} / {data.pages}</Typography><Button color="inherit" disabled={data.page >= data.pages} onClick={() => change({ page: data.page + 1 })}>التالي</Button></Box>}
    </> : <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5">لا توجد عمليات مطابقة محفوظة</Typography><Typography color="text.secondary" mt={1}>خفف الفلاتر أو حدّث النتائج بعد حفظ عملية جديدة. السجل الفارغ لا يثبت عدم حدوث تعديلات قديمة.</Typography></Box>)}
    {exporting && <HistoryExportDialog snapshot={exporting.snapshot} isCurrent={() => client.isCurrent() && read.query === query && read.data === exporting.source && !read.loading && !read.error} onClose={() => setExporting(null)} />}
  </Box>;
}
