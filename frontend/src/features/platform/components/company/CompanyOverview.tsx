import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Typography } from '@mui/material';
import type { JobManagementClient } from '../../api/jobManagement';
import type { CompanyOverviewData } from '../../api/companyOverview';
import { messageDate } from '../../utils/messages';
import type { PublicationView } from '../../utils/companyDashboard';
export default function CompanyOverview({ companyId, client, disabled, onView }: { companyId: string; client: JobManagementClient; disabled: boolean; onView: (view: PublicationView) => void }) {
  const [read, setRead] = useState<{ data: CompanyOverviewData | null; loading: boolean; error: string }>({ data: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setRead({ data: null, loading: true, error: '' });
    void client.overview(companyId, controller.signal).then(data => { if (!controller.signal.aborted) setRead({ data, loading: false, error: '' }); }).catch(failure => { if (!controller.signal.aborted) setRead({ data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل ملخص الشركة.' }); });
    return () => controller.abort();
  }, [client, companyId, retry]);
  if (read.loading) return <Typography role="status" my={3}>جارٍ تحميل ملخص الشركة…</Typography>;
  if (read.error || !read.data) return <Alert severity="warning" sx={{ my: 3 }}>{read.error || 'تعذر قراءة ملخص الشركة.'}<Button color="inherit" disabled={disabled} onClick={() => setRetry(value => value + 1)}>إعادة تحميل الملخص</Button></Alert>;
  return <CompanyOverviewCards data={read.data} disabled={disabled} onView={onView} />;
}
export function CompanyOverviewCards({ data, disabled, onView }: { data: CompanyOverviewData; disabled: boolean; onView: (view: PublicationView) => void }) {
  const messagesPath = '/admin/messages?' + new URLSearchParams({ company: data.company_id });
  const tiles = [
    { label: 'وظائف مفتوحة للتقديم', value: data.jobs.open, hint: `من أصل ${data.jobs.total} وظيفة`, action: <Button color="inherit" disabled={disabled} onClick={() => onView('open')}>عرض الوظائف المفتوحة</Button> },
    { label: 'طلبات التوظيف', value: data.applications.total, hint: `${data.applications.by_status.pending} طلب قيد الانتظار`, action: <Button color="inherit" component={Link} disabled={disabled} to={'/admin/applicants?' + new URLSearchParams({ company: data.company_id })}>اختيار وظيفة لمراجعة طلباتها</Button> },
    { label: 'رسائل غير مقروءة', value: data.messages.unread, hint: 'من نموذج تواصل الشركة', action: <Button color="inherit" component={Link} disabled={disabled} to={messagesPath + '&is_read=false'}>عرض غير المقروءة</Button> },
    { label: 'كل رسائل الشركة', value: data.messages.total, hint: `${data.messages.read} رسالة مقروءة`, action: <Button color="inherit" component={Link} disabled={disabled} to={messagesPath}>فتح صندوق الرسائل</Button> },
  ];
  return <Box component="section" aria-label="ملخص الشركة" my={3}><Typography component="h2" variant="h5" fontWeight={700} mb={.5}>ملخص الشركة</Typography><Typography color="text.secondary" mb={2}>الأعداد تشمل جميع وظائف ورسائل الشركة المختارة. آخر تحميل: {messageDate(data.generated_at)}.</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 2 }}>{tiles.map(tile => <Box key={tile.label} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}><Typography fontWeight={700}>{tile.label}</Typography><Typography component="p" variant="h4" sx={{ fontSize: 30, fontWeight: 800, my: .5 }}>{tile.value}</Typography><Typography color="text.secondary" mb={1}>{tile.hint}</Typography><Box mt="auto">{tile.action}</Box></Box>)}</Box>
    <Box display="flex" gap={1} flexWrap="wrap" mt={2}><Button color="inherit" disabled={disabled} onClick={() => onView('all')}>كل الوظائف: {data.jobs.total}</Button><Button color="inherit" disabled={disabled} onClick={() => onView('paused')}>موقوفة: {data.jobs.paused}</Button><Button color="inherit" disabled={disabled} onClick={() => onView('expired')}>انتهى التقديم: {data.jobs.expired}</Button>{data.jobs.company_paused > 0 && <Button color="inherit" disabled={disabled} onClick={() => onView('company_paused')}>بسبب إيقاف الشركة: {data.jobs.company_paused}</Button>}</Box>
  </Box>;
}
