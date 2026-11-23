import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../../../shared/AuthContext';
import { applicationStatuses, type ApplicationRecord, type ApplicationStatus } from '../../api/recruitment';
import { createApplicantsClient, type ApplicantsResponse } from '../../api/applicantsClient';
import { applicantsApiQuery, patchApplicantsSearch, readApplicantsSearch, selectedApplicantJob } from '../../utils/applicants';
import useCompanyWorkspace from '../../hooks/useCompanyWorkspace';
import CompanyPicker from '../../components/company/CompanyPicker';
import ApplicantCard from '../../components/applicants/ApplicantCard';
export default function Applicants() { const { user } = useAuth(); return user ? <ApplicantsWorkspace key={user._id + ':' + user.role} accountId={user._id} role={user.role} /> : null; }
function ApplicantsWorkspace({ accountId, role }: { accountId: string; role: string }) {
  const workspace = useCompanyWorkspace(); const [params, setParams] = useSearchParams(); const [busy, setBusy] = useState(false);
  const job = selectedApplicantJob(workspace.jobs, params.get('job')); const company = workspace.company;
  const invalidJob = !workspace.loading && !workspace.error && !!company && params.has('job') && !job;
  return <Box m={{ xs: 2, md: 4 }} dir="rtl" sx={{ fontFamily: "\'Tajawal\', \'Segoe UI\', sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root, & .MuiFormHelperText-root': { fontFamily: 'inherit' } }}><Typography component="h1" variant="h3" fontWeight="bold">المتقدمون للوظائف</Typography><Typography color="text.secondary" mt={1}>راجع الطلبات واختر حالتها، ثم اضغط «حفظ الحالة» لتأكيد التغيير.</Typography>
    <CompanyPicker companies={workspace.companies} selected={company} isAdmin={workspace.isAdmin} disabled={busy || workspace.loading} onSelect={id => setParams(previous => patchApplicantsSearch(previous, { company: id }))} />
    {company && <Button color="inherit" component={Link} disabled={busy} to={`/admin/company-dashboard?company=${company._id}`}>إدارة وظائف الشركة</Button>}
    {!!workspace.jobs.length && <TextField select SelectProps={{ native: true }} fullWidth label="الوظيفة" value={job?._id || ''} disabled={busy || workspace.loading} onChange={event => { if (company) setParams(previous => patchApplicantsSearch(previous, { company: company._id, job: event.target.value })); }} sx={{ my: 3 }}>{!job && <option value="" disabled>اختر وظيفة</option>}{workspace.jobs.map(item => <option key={item._id} value={item._id}>{item.title}{item.is_active ? '' : ' (موقوفة)'}</option>)}</TextField>}
    {workspace.error && <Alert severity="error" sx={{ my: 2 }}>{workspace.error}<Button color="inherit" disabled={busy} onClick={workspace.refresh}>إعادة تحميل الشركات والوظائف</Button></Alert>}
    {invalidJob && <Alert severity="warning" sx={{ my: 2 }}>{workspace.jobs.length ? 'الوظيفة المحددة في الرابط غير موجودة ضمن هذه الشركة. اختر وظيفة من القائمة.' : 'الوظيفة المحددة غير متاحة، ولا توجد وظائف لهذه الشركة حاليًا. يمكنك مراجعتها من إدارة وظائف الشركة.'}</Alert>}
    {workspace.loading ? <Typography role="status" my={3}>جارٍ تحميل الشركات والوظائف…</Typography> : !workspace.error && !invalidJob && (!company ? <Typography my={3}>لا توجد شركة مرتبطة أو متاحة لهذا الحساب.</Typography> : !job ? <Box sx={{ p: 3, my: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5" mb={1}>لا توجد وظائف لعرض متقدميها</Typography><Typography color="text.secondary" mb={2}>اختر شركة أخرى أو أضف وظيفة من لوحة الشركة أولًا.</Typography><Button color="inherit" component={Link} to={`/admin/company-dashboard?company=${company._id}`}>إدارة وظائف الشركة</Button></Box> : <ApplicantsResults key={company._id + ':' + job._id} accountId={accountId} role={role} companyId={company._id} jobId={job._id} onBusy={setBusy} />)}
  </Box>;
}
function ApplicantsResults({ accountId, role, companyId, jobId, onBusy }: { accountId: string; role: string; companyId: string; jobId: string; onBusy: (busy: boolean) => void }) {
  const [client] = useState(() => createApplicantsClient(accountId, role)); const [params, setParams] = useSearchParams(); const state = useMemo(() => readApplicantsSearch(params), [params]);
  const query = applicantsApiQuery(state).toString();
  const [read, setRead] = useState<{ query: string; data: ApplicantsResponse | null; loading: boolean; error: string }>({ query: '', data: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false); const [writeError, setWriteError] = useState(''); const [message, setMessage] = useState('');
  const pending = useRef(false); const mutation = useRef<AbortController | null>(null);
  useEffect(() => { onBusy(busy); return () => onBusy(false); }, [busy, onBusy]);
  useEffect(() => () => mutation.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController(); setRead({ query, data: null, loading: true, error: '' });
    const timer = window.setTimeout(() => { void client.list(companyId, jobId, new URLSearchParams(query), controller.signal)
      .then(data => { if (!controller.signal.aborted) setRead({ query, data, loading: false, error: '' }); })
      .catch(failure => { if (!controller.signal.aborted) setRead({ query, data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل المتقدمين.' }); }); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, companyId, jobId, query, retry]);
  const matches = read.query === query; const loading = !matches || read.loading; const data = matches ? read.data : null; const error = matches ? read.error : '';
  useEffect(() => { if (!loading && !error && data && data.page !== state.page) setParams(previous => patchApplicantsSearch(previous, { page: data.page }), { replace: true }); }, [loading, error, data, state.page, setParams]);
  function change(patch: Partial<typeof state>, replace = false) { if (pending.current) return; setMessage(''); if (writeError) setRetry(value => value + 1); setWriteError(''); setParams(previous => patchApplicantsSearch(previous, patch), { replace }); }
  function reload() { if (pending.current) return; setWriteError(''); setMessage(''); setRetry(value => value + 1); }
  async function save(application: ApplicationRecord, desired: ApplicationStatus) {
    if (pending.current || loading || error || writeError || desired === application.status) return;
    pending.current = true; setBusy(true); setMessage(''); const request = new AbortController(); mutation.current = request;
    try { await client.saveStatus(application, companyId, jobId, desired, request.signal); if (!request.signal.aborted) { setMessage('تم حفظ حالة الطلب: ' + applicationStatuses[desired] + '.'); setRetry(value => value + 1); } }
    catch (failure) { if (!request.signal.aborted) setWriteError(failure instanceof Error ? failure.message : 'تعذر تأكيد حفظ الحالة. أعد تحميل القائمة.'); }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  const jobTotal = data ? Object.values(data.counts).reduce((total, count) => total + count, 0) : 0;
  return <Box mt={3} aria-label="طلبات الوظيفة المحددة">
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr 1fr' }} gap={2} mb={2}>
      <TextField label="البحث بالاسم أو البريد" type="search" value={state.q} disabled={busy} inputProps={{ maxLength: 120 }} onChange={event => change({ q: event.target.value }, true)} />
      <TextField select label="تصفية حالة الطلب" SelectProps={{ native: true }} value={state.status} disabled={busy} onChange={event => change({ status: event.target.value as typeof state.status })}><option value="">كل الحالات</option>{Object.entries(applicationStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</TextField>
      <TextField select label="ترتيب الطلبات" SelectProps={{ native: true }} value={state.sort} disabled={busy} onChange={event => change({ sort: event.target.value as typeof state.sort })}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></TextField>
    </Box>
    <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={2}><Button color="inherit" type="button" disabled={busy} onClick={() => change({ q: '', status: '', sort: 'newest', page: 1 })}>مسح البحث والفلاتر</Button><Button color="inherit" type="button" disabled={busy} onClick={reload}>تحديث الطلبات</Button><Typography role="status" color="text.secondary">{loading ? 'جارٍ تحميل المتقدمين…' : !error && data ? `${data.total} نتيجة، من أصل ${jobTotal} طلب لهذه الوظيفة` : ''}</Typography></Box>
    {(error || writeError) && <Alert severity="error" sx={{ my: 2 }}>{error || writeError}<Button color="inherit" disabled={busy} onClick={reload}>إعادة تحميل الطلبات</Button></Alert>}
    {message && <Alert severity="success" sx={{ my: 2 }}>{message}</Alert>}
    {!loading && !error && !writeError && data && (!data.applications.length ? <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5" mb={1}>{jobTotal ? 'لا توجد طلبات مطابقة' : 'لم يتقدم أحد لهذه الوظيفة بعد'}</Typography><Typography color="text.secondary">{jobTotal ? 'جرّب بحثًا آخر أو اعرض كل الحالات.' : 'ستظهر طلبات الباحثين عن عمل هنا بعد التقديم.'}</Typography></Box> : <>
      <Box display="grid" gap={2}>{data.applications.map(application => <ApplicantCard key={application._id + ':' + (application.__v || 0)} application={application} disabled={busy} onSave={status => void save(application, status)} />)}</Box>
      {data.pages > 1 && <Box component="nav" aria-label="صفحات المتقدمين" display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" gap={2} mt={3}><Button color="inherit" disabled={busy || data.page <= 1} onClick={() => change({ page: data.page - 1 })}>السابق</Button><Typography>الصفحة {data.page} من {data.pages}</Typography><Button color="inherit" disabled={busy || data.page >= data.pages} onClick={() => change({ page: data.page + 1 })}>التالي</Button></Box>}
    </>)}
  </Box>;
}
