import { useEffect, useId, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useAuth } from '../../../../shared/AuthContext';
import { createManagementHistoryClient, type HistoryEvent, type HistoryKind, type HistoryResult, type ManagementHistoryClient } from '../../api/managementHistory';
import { historyFieldLabels as fieldNames, historyStateText as states } from '../../utils/managementHistoryLabels';
const actionNames: Record<string, string> = { 'account.access': 'تغيير حالة الحساب أو صلاحيته', 'company.create': 'إنشاء الشركة', 'company.update': 'حفظ بيانات الشركة', 'company.archive': 'إيقاف الشركة', 'company.verify': 'تغيير توثيق الشركة', 'company.link_account': 'ربط حساب إدارة الشركة' };
export function HistoryEventItem({ event, subject, timeZone }: { event: HistoryEvent; subject?: ReactNode; timeZone?: string }) {
  return <Box component="li" sx={{ listStyle: 'none', py: 2.5, borderBottom: '1px solid', borderColor: 'divider', overflowWrap: 'anywhere' }}>
    {subject}<Typography component="h3" sx={{ fontSize: 16, fontWeight: 700 }}>{actionNames[event.action]}</Typography><Typography component="time" dateTime={event.at} color="text.secondary" sx={{ display: 'block', my: .5 }}>{new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short', ...(timeZone ? { timeZone } : {}) }).format(new Date(event.at))}</Typography>
    <Typography>المنفّذ: {event.actor_name || 'اسم غير متاح'} · {event.actor_role === 'admin' ? 'مدير' : 'مسؤول الشركة'}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>معرّف المنفّذ: <bdi>{event.actor_id}</bdi></Typography>
    <Typography mt={1}>{event.fields.length ? 'الحقول المتأثرة: ' + event.fields.map(field => fieldNames[field]).join('، ') : 'حفظ دون تغيير في قيم الحقول.'}</Typography>
    {event.before && <Typography color="text.secondary" mt={1}>قبل الحفظ: {states(event.before)}</Typography>}{event.after && <Typography>بعد الحفظ: {states(event.after)}</Typography>}
  </Box>;
}
export function HistoryViewer({ kind, targetId, label, client, disabled = false }: { kind: HistoryKind; targetId: string; label: string; client: ManagementHistoryClient; disabled?: boolean }) {
  const [open, setOpen] = useState(false); const [retry, setRetry] = useState(0); const [read, setRead] = useState<{ data: HistoryResult | null; error: string }>({ data: null, error: '' }); const id = useId();
  useEffect(() => {
    if (!open) return; const controller = new AbortController(); setRead({ data: null, error: '' });
    void client.read(kind, targetId, controller.signal).then(data => { if (!controller.signal.aborted) setRead({ data, error: '' }); }).catch(failure => { if (!controller.signal.aborted) setRead({ data: null, error: failure instanceof Error ? failure.message : 'تعذر تحميل السجل.' }); });
    return () => controller.abort();
  }, [open, retry, client, kind, targetId]);
  function close() { setOpen(false); setRead({ data: null, error: '' }); }
  function refresh() { setRead({ data: null, error: '' }); setRetry(value => value + 1); }
  return <><Button color="inherit" disabled={disabled} onClick={() => { setRead({ data: null, error: '' }); setOpen(true); }} aria-label={'سجل تغييرات ' + label}>سجل التغييرات</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby={id} PaperProps={{ dir: 'rtl', sx: { m: 2, width: 'calc(100% - 32px)', fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root,& .MuiButton-root': { fontFamily: 'inherit', overflowWrap: 'anywhere' }, '& .MuiTypography-root': { fontSize: 14, lineHeight: 1.9 }, '& .MuiDialogTitle-root': { fontSize: 22, fontWeight: 800 } } }}>
      <DialogTitle id={id}>سجل التغييرات</DialogTitle><DialogContent dividers><Typography fontWeight={700} mb={1}>{label}</Typography><Typography color="text.secondary" mb={2}>يعرض العمليات المسجلة منذ تفعيل السجل فقط، ويحتفظ بآخر 100 عملية. أسماء المنفّذين تعكس أسماء حساباتهم الحالية.</Typography>
        {read.error ? <Alert severity="error">{read.error}<Button color="inherit" onClick={refresh}>إعادة المحاولة</Button></Alert> : !read.data ? <Typography role="status">جارٍ تحميل سجل التغييرات…</Typography> : <>
          <Typography role="status">{read.data.events.length} عملية معروضة من {read.data.recorded_total} عملية مسجلة.</Typography>{read.data.recorded_total > 100 && <Alert severity="info" sx={{ mt: 2 }}>العمليات الأقدم من آخر 100 عملية لم تعد محفوظة في هذا السجل.</Alert>}
          {read.data.events.length ? <Box component="ol" sx={{ p: 0, m: 0 }}>{read.data.events.map(event => <HistoryEventItem key={event.revision} event={event} />)}</Box> : <Box sx={{ py: 4 }}><Typography component="h3" fontWeight={700}>لا توجد عمليات مسجلة بعد</Typography><Typography color="text.secondary">هذا لا يعني أن الحساب أو الشركة لم يُعدّل سابقًا. ستظهر العمليات المدعومة الجديدة بعد حفظها.</Typography></Box>}
        </>}
      </DialogContent><DialogActions sx={{ p: 2, gap: 1 }}><Button color="inherit" disabled={!read.data && !read.error} onClick={refresh}>تحديث السجل</Button><Button color="secondary" variant="contained" onClick={close}>إغلاق</Button></DialogActions>
    </Dialog></>;
}
function BoundHistory({ kind, targetId, label, accountId, disabled }: { kind: HistoryKind; targetId: string; label: string; accountId: string; disabled?: boolean }) { const [client] = useState(() => createManagementHistoryClient(accountId, 'admin')); return <HistoryViewer kind={kind} targetId={targetId} label={label} client={client} disabled={disabled} />; }
export default function HistoryButton(props: { kind: HistoryKind; targetId: string; label: string; disabled?: boolean }) { const { user } = useAuth(); return user?.role === 'admin' ? <BoundHistory key={user._id + ':' + props.kind + ':' + props.targetId} {...props} accountId={user._id} /> : null; }
