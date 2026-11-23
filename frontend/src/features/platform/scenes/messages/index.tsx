import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../../../shared/AuthContext';
import { createInboxClient, type InboxMessage, type InboxResponse } from '../../api/inboxClient';
import { messagesQuery, patchMessagesSearch, readMessagesSearch } from '../../utils/messages';
import useCompanyWorkspace from '../../hooks/useCompanyWorkspace';
import CompanyPicker from '../../components/company/CompanyPicker';
import MessageCard from '../../components/messages/MessageCard';
export default function CompanyMessages() { const { user } = useAuth(); return user ? <MessagesWorkspace key={user._id + ':' + user.role} accountId={user._id} role={user.role} /> : null; }
function MessagesWorkspace({ accountId, role }: { accountId: string; role: string }) {
  const workspace = useCompanyWorkspace(false); const [, setParams] = useSearchParams(); const [busy, setBusy] = useState(false);
  return <Box m={{ xs: 2, md: 4 }} dir="rtl" sx={{ fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& .MuiInputLabel-root, & .MuiButton-root, & .MuiTypography-body1': { fontSize: 14 }, '& .MuiTypography-body1': { fontSize: 14, lineHeight: 1.8 } }}>
    <Typography component="h1" variant="h3" fontWeight={800}>رسائل الشركة</Typography><Typography mt={1} color="text.secondary">رسائل نموذج التواصل. فتح الرسالة لا يغيّر حالة قراءتها، والرد يُفتح في تطبيق بريدك.</Typography>
    <CompanyPicker companies={workspace.companies} selected={workspace.company} isAdmin={workspace.isAdmin} disabled={busy || workspace.loading} onSelect={company => setParams(previous => patchMessagesSearch(previous, { company }))} />
    {workspace.company && <Button color="inherit" component={Link} disabled={busy} to={`/admin/company-dashboard?company=${workspace.company._id}`}>العودة إلى لوحة الشركة</Button>}
    {workspace.loading ? <Typography role="status" my={3}>جارٍ تحميل الشركات…</Typography> : workspace.error ? <Alert severity="error" sx={{ my: 2 }}>{workspace.error}<Button color="inherit" onClick={workspace.refresh}>إعادة تحميل الشركات</Button></Alert> : !workspace.company ? <Typography my={3}>لا توجد شركة مرتبطة أو متاحة لهذا الحساب.</Typography> : <MessagesResults key={workspace.company._id} companyId={workspace.company._id} accountId={accountId} role={role} onBusy={setBusy} />}
  </Box>;
}
function MessagesResults({ companyId, accountId, role, onBusy }: { companyId: string; accountId: string; role: string; onBusy: (busy: boolean) => void }) {
  const [client] = useState(() => createInboxClient(accountId, role)); const [params, setParams] = useSearchParams(); const state = useMemo(() => readMessagesSearch(params), [params]); const query = messagesQuery(state).toString();
  const [read, setRead] = useState<{ query: string; data: InboxResponse | null; loading: boolean; error: string }>({ query: '', data: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false); const [writeError, setWriteError] = useState(''); const [notice, setNotice] = useState('');
  const pending = useRef(false); const mutation = useRef<AbortController | null>(null);
  useEffect(() => () => { mutation.current?.abort(); onBusy(false); }, [onBusy]);
  useEffect(() => {
    const controller = new AbortController(); setRead({ query, data: null, loading: true, error: '' });
    const timer = window.setTimeout(() => {
      void client.list(companyId, new URLSearchParams(query), controller.signal).then(data => {
        if (controller.signal.aborted) return; setRead({ query, data, loading: false, error: '' });
        const requested = Number(new URLSearchParams(query).get('page')); if (data.page !== requested) setParams(previous => messagesQuery(readMessagesSearch(previous)).toString() === query ? patchMessagesSearch(previous, { page: data.page }) : previous, { replace: true });
      }).catch(failure => { if (!controller.signal.aborted) setRead({ query, data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل الرسائل.' }); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, companyId, query, retry, setParams]);
  const loading = read.query !== query || read.loading; const data = read.query === query ? read.data : null; const error = read.query === query ? read.error : '';
  function reload() { if (pending.current) return; setWriteError(''); setNotice(''); setRead({ query, data: null, loading: true, error: '' }); setRetry(value => value + 1); }
  function change(patch: Record<string, string | number>) { if (pending.current) return; setWriteError(''); setNotice(''); setParams(previous => patchMessagesSearch(previous, patch), { replace: 'q' in patch }); }
  async function save(message: InboxMessage, desired: boolean) {
    if (pending.current || loading || error || writeError || !data) return;
    pending.current = true; setBusy(true); onBusy(true); setNotice(''); setWriteError(''); const controller = new AbortController(); mutation.current = controller;
    try { await client.setRead(message, companyId, desired, controller.signal); if (!controller.signal.aborted) { setNotice(desired ? 'تم تعليم الرسالة كمقروءة.' : 'تم تعليم الرسالة كغير مقروءة.'); setRead({ query, data: null, loading: true, error: '' }); setRetry(value => value + 1); } }
    catch (failure) { if (!controller.signal.aborted) setWriteError(failure instanceof Error ? failure.message : 'تعذر تأكيد تغيير حالة القراءة. حدّث القائمة.'); }
    finally { if (!controller.signal.aborted) { pending.current = false; setBusy(false); onBusy(false); } }
  }
  return <Box mt={3} aria-busy={loading || busy}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '2fr 1fr 1fr' }, gap: 2 }}>
      <TextField label="ابحث في الرسائل" placeholder="الاسم أو البريد أو الموضوع أو نص الرسالة" value={state.search} disabled={busy} inputProps={{ maxLength: 120 }} onChange={event => change({ q: event.target.value })} />
      <TextField select SelectProps={{ native: true }} label="حالة القراءة" value={state.filter} disabled={busy} onChange={event => change({ is_read: event.target.value })}><option value="all">كل الرسائل</option><option value="false">غير المقروءة</option><option value="true">المقروءة</option></TextField>
      <TextField select SelectProps={{ native: true }} label="الترتيب" value={state.sort} disabled={busy} onChange={event => change({ sort: event.target.value })}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></TextField>
    </Box>
    <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} my={2}><Button color="inherit" variant="outlined" disabled={busy || loading} onClick={reload}>تحديث الرسائل</Button><Typography role="status" color="text.secondary">{loading ? 'جارٍ تحميل الرسائل…' : !error && data ? `${data.total} نتيجة · إجمالي الشركة: ${data.counts.unread} غير مقروءة، ${data.counts.read} مقروءة` : ''}</Typography></Box>
    {(error || writeError) && <Alert severity="error" sx={{ my: 2 }}>{error || writeError}<Button color="inherit" disabled={busy || loading} onClick={reload}>إعادة تحميل الرسائل</Button></Alert>}
    {notice && <Alert severity="success" sx={{ my: 2 }}>{notice}</Alert>}
    {!loading && !error && !writeError && data && (!data.messages.length ? <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5" mb={1}>{data.counts.read + data.counts.unread ? 'لا توجد رسائل مطابقة' : 'لم تصل رسائل بعد'}</Typography><Typography color="text.secondary">{data.counts.read + data.counts.unread ? 'جرّب بحثًا آخر أو اعرض كل حالات القراءة.' : 'ستظهر هنا الرسائل التي يرسلها الزوار من صفحة شركتك.'}</Typography></Box> : <>
      <Box display="grid" gap={2}>{data.messages.map(message => <MessageCard key={message._id + ':' + (message.__v || 0)} message={message} disabled={busy} onRead={desired => void save(message, desired)} />)}</Box>
      {data.pages > 1 && <Box component="nav" aria-label="صفحات الرسائل" display="flex" gap={2} justifyContent="center" alignItems="center" flexWrap="wrap" mt={3}><Button color="inherit" disabled={busy || data.page <= 1} onClick={() => change({ page: data.page - 1 })}>السابق</Button><Typography>الصفحة {data.page} من {data.pages}</Typography><Button color="inherit" disabled={busy || data.page >= data.pages} onClick={() => change({ page: data.page + 1 })}>التالي</Button></Box>}
    </>)}
  </Box>;
}
