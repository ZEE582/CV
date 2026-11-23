import CvDownloadButton from '../components/applications/CvDownloadButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useAuth } from '../../../shared/AuthContext';
import { applicationStatuses, safeDocumentUrl, type ApplicationRecord } from '../api/recruitment';
import { createMyApplicationsClient, type MyApplicationsClient } from '../api/myApplicationsClient';
import { myApplicationsResults, patchMyApplicationsSearch, readMyApplicationsSearch } from '../utils/myApplications';
import { applicantDate } from '../utils/applicants';
import ApplicationJobDialog from '../components/applications/ApplicationJobDialog';
import ApplicationHistoryDialog from '../components/applications/ApplicationHistoryDialog';
import ApplicationExportDialog from '../components/applications/ApplicationExportDialog';
import './MyApplications.css';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  return user?.role === 'seeker' ? <AccountApplications key={user._id + ':' + user.role} accountId={user._id} /> : null;
}
function AccountApplications({ accountId }: { accountId: string }) {
  const [client] = useState(() => createMyApplicationsClient(accountId, 'seeker'));
  return <MyApplicationsWorkspace client={client} />;
}
export function MyApplicationsWorkspace({ client }: { client: MyApplicationsClient }) {
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => readMyApplicationsSearch(params), [params]);
  const [read, setRead] = useState<{ items: ApplicationRecord[]; loading: boolean; error: string }>({ items: [], loading: true, error: '' });
  const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [details, setDetails] = useState<ApplicationRecord | null>(null);
  const [history, setHistory] = useState<ApplicationRecord | null>(null);
  const [exporting, setExporting] = useState<ApplicationRecord | null>(null);
  const [writeError, setWriteError] = useState(''); const [message, setMessage] = useState('');
  const [sessionChanged, setSessionChanged] = useState(false);
  const pending = useRef(false); const mutation = useRef<AbortController | null>(null);
  const feedback = useRef<HTMLDivElement | null>(null);
  const listHeading = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (writeError || message || read.error) feedback.current?.focus(); }, [writeError, message, read.error]);
  useEffect(() => {
    const check = () => { if (!client.isCurrent()) { setSessionChanged(true); mutation.current?.abort(); } };
    window.addEventListener('storage', check); window.addEventListener('focus', check);
    return () => { window.removeEventListener('storage', check); window.removeEventListener('focus', check); mutation.current?.abort(); };
  }, [client]);
  useEffect(() => {
    const request = new AbortController(); setRead({ items: [], loading: true, error: '' });
    void client.list(request.signal).then(items => { if (!request.signal.aborted) setRead({ items, loading: false, error: '' }); })
      .catch(failure => { if (!request.signal.aborted) setRead({ items: [], loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل الطلبات.' }); });
    return () => request.abort();
  }, [client, retry]);
  const results = useMemo(() => myApplicationsResults(read.items, search), [read.items, search]);
  useEffect(() => {
    if (!read.loading && !read.error && results.page !== search.page) setParams(previous => patchMyApplicationsSearch(previous, { page: results.page }), { replace: true });
  }, [read.loading, read.error, results.page, search.page, setParams]);
  function refresh() { if (pending.current) return; setSelected(null); setWriteError(''); setMessage(''); setRetry(value => value + 1); }
  function changePage(page: number) { setParams(previous => patchMyApplicationsSearch(previous, { page })); listHeading.current?.focus(); }
  async function withdraw() {
    if (!selected || pending.current || read.loading || read.error || writeError) return;
    pending.current = true; setBusy(true); setMessage(''); const application = selected; setSelected(null);
    const request = new AbortController(); mutation.current = request;
    try {
      await client.withdraw(application, request.signal);
      if (!request.signal.aborted) { setMessage('تم تأكيد سحب طلبك.'); setRetry(value => value + 1); }
    } catch (failure) { if (!request.signal.aborted) setWriteError(failure instanceof Error ? failure.message : 'تعذر تأكيد السحب. أعد تحميل الطلبات.'); }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  if (sessionChanged || !client.isCurrent()) return <section className="applications-page" dir="rtl"><h1>طلبات التوظيف</h1><p role="alert">تغيّرت جلسة الدخول. سجل الدخول مجددًا لعرض طلباتك.</p><Link to="/login" state={{ from: { pathname: '/applications' } }}>تسجيل الدخول</Link></section>;
  const filtered = !!search.q.trim() || !!search.status;
  const unavailable = read.loading || !!read.error;
  return <section className="applications-page" dir="rtl" aria-labelledby="applications-title">
    <header className="applications-heading"><div><h1 id="applications-title">طلبات التوظيف</h1><p>تابع طلباتك وآخر حالاتها في مكان واحد.</p></div><Link className="applications-primary-link" to="/jobs">تصفح الوظائف</Link></header>
    <div className="applications-toolbar">
      <label>الوظيفة أو الشركة<input type="search" value={search.q} maxLength={120} placeholder="ابحث ضمن طلباتك" disabled={busy} onChange={e => setParams(previous => patchMyApplicationsSearch(previous, { q: e.target.value }), { replace: true })} /></label>
      <label>حالة الطلب<select aria-label="حالة الطلب" value={search.status} disabled={busy} onChange={e => setParams(previous => patchMyApplicationsSearch(previous, { status: e.target.value as typeof search.status }))}><option value="">كل الحالات{!unavailable ? ` (${read.items.length})` : ''}</option>{Object.entries(applicationStatuses).map(([value, label]) => <option value={value} key={value}>{label}{!unavailable ? ` (${results.counts[value as keyof typeof applicationStatuses]})` : ''}</option>)}</select></label>
      <label>ترتيب الطلبات<select aria-label="ترتيب الطلبات" value={search.sort} disabled={busy} onChange={e => setParams(previous => patchMyApplicationsSearch(previous, { sort: e.target.value as typeof search.sort }))}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></select></label>
    </div>
    <div className="applications-list-heading" ref={listHeading} tabIndex={-1}><p role="status">{read.loading ? 'جارٍ تحميل طلباتك…' : read.error ? 'لم تُحمّل الطلبات' : `${results.total.toLocaleString('ar')} طلب${filtered ? ' مطابق للبحث' : ''}`}</p><button type="button" className="applications-text-button" disabled={busy || read.loading} onClick={refresh}>تحديث الحالات</button></div>
    {busy && <p role="status">جارٍ إرسال طلب السحب…</p>}
    <div ref={feedback} tabIndex={-1}>
    {read.error && <div className="applications-notice is-error" role="alert"><p>{read.error}</p><button type="button" onClick={refresh} disabled={busy}>إعادة التحميل</button></div>}
    {writeError && <div className="applications-notice is-error" role="alert"><p>{writeError}</p><button type="button" onClick={refresh} disabled={busy}>التحقق من أحدث الطلبات</button></div>}
    {message && <p className="applications-notice is-success" role="status">{message}</p>}
    </div>
    {!unavailable && !results.total && <div className="applications-empty"><h2>{filtered && read.items.length ? 'لا توجد طلبات تطابق البحث' : 'ابدأ بخطوتك المهنية القادمة'}</h2><p>{filtered && read.items.length ? 'جرّب اسم وظيفة أو شركة آخر، أو أزل الفلاتر.' : 'عند التقديم على وظيفة، ستظهر هنا حالة طلبك وتاريخ تقديمه.'}</p>{filtered ? <button type="button" onClick={() => setParams(previous => patchMyApplicationsSearch(previous, { q: '', status: '' }))}>مسح البحث والفلاتر</button> : <Link to="/jobs">استكشف الوظائف المتاحة</Link>}</div>}
    {!unavailable && results.items.map(application => {
      const job = typeof application.job_id === 'object' ? application.job_id : null;
      const company = typeof application.company_id === 'object' ? application.company_id : null;
      const title = job?.title || application.snapshot_title || 'وظيفة غير متاحة';
      const cv = safeDocumentUrl(application.cv_url);
      return <article className="applications-row" key={application._id} aria-labelledby={'application-' + application._id}>
        <div className="applications-row-top"><div><p className="applications-company">{company?.name_ar || application.snapshot_company_name || 'شركة غير متاحة'}</p><h2 id={'application-' + application._id}>{title}</h2></div><span className={'applications-status status-' + application.status}>{applicationStatuses[application.status]}</span></div>
        <p className="applications-dates">تاريخ التقديم: {applicantDate(application.createdAt)}{application.updatedAt && application.updatedAt !== application.createdAt ? ' · آخر تحديث: ' + applicantDate(application.updatedAt) : ''}</p>
        {job?.is_active === false && <p className="applications-closed">الوظيفة موقوفة حاليًا. يبقى طلبك محفوظًا.</p>}
        {(!job || !company) && <p className="applications-closed">{application.has_job_snapshot ? 'الإعلان الحالي أو الشركة لم يعودا متاحين. يمكنك مراجعة النسخة المحفوظة مع طلبك.' : 'تفاصيل الوظيفة أو الشركة لم تعد متاحة.'}</p>}
        {application.cover_letter && <details><summary>رسالة التقديم التي أرسلتها</summary><p className="applications-letter">{application.cover_letter}</p></details>}
        <div className="applications-row-actions">{application.cv_file && <CvDownloadButton applicationId={application._id} file={application.cv_file} disabled={busy} />}<button type="button" disabled={busy} aria-label={'تصدير طلب ' + title} onClick={() => setExporting(application)}>نسخة من الطلب</button><button type="button" disabled={busy} aria-label={'سجل حالة طلب ' + title} onClick={() => setHistory(application)}>سجل حالة الطلب</button>{(job || application.has_job_snapshot) && <button type="button" disabled={busy} aria-label={'تفاصيل وظيفة ' + title} onClick={() => setDetails(application)}>تفاصيل الوظيفة</button>}{job?.is_active && company && <Link to={`/company/${encodeURIComponent(company._id)}?job=${encodeURIComponent(job._id)}`} state={{ fromApplications: '/applications' + (params.toString() ? '?' + params.toString() : '') }}>صفحة الوظيفة العامة</Link>}{cv && <a href={cv} target="_blank" rel="noopener noreferrer">رابط سيرتي المرفق</a>}{application.status === 'pending' && <button type="button" className="applications-withdraw" disabled={busy || !!writeError} aria-label={'سحب طلب ' + title} onClick={() => setSelected(application)}>سحب الطلب</button>}</div>
      </article>;
    })}
    {!unavailable && results.total > 0 && <nav className="applications-pagination" aria-label="صفحات طلبات التوظيف"><button type="button" disabled={busy || results.page === 1} onClick={() => changePage(results.page - 1)}>السابق</button><span aria-live="polite">الصفحة {results.page.toLocaleString('ar')} من {results.pages.toLocaleString('ar')}</span><button type="button" disabled={busy || results.page === results.pages} onClick={() => changePage(results.page + 1)}>التالي</button></nav>}
    <p className="applications-footnote">الحالة تعكس آخر تحديث حمّلته من المنصة. يمكنك سحب الطلب قيد الانتظار فقط.</p>
    {details && <ApplicationJobDialog key={details._id} application={details} client={client} onClose={() => setDetails(null)} />}
    {history && <ApplicationHistoryDialog key={history._id} application={history} client={client} onClose={latest => { setHistory(null); if (latest && (latest.version !== (history.__v ?? 0) || latest.status !== history.status)) setRetry(value => value + 1); }} />}
    {exporting && <ApplicationExportDialog key={exporting._id} application={exporting} client={client} onClose={latest => { setExporting(null); if (latest && (latest.application.version !== (exporting.__v ?? 0) || latest.application.status !== exporting.status)) setRetry(value => value + 1); }} />}
    <Dialog open={!!selected} onClose={() => setSelected(null)} aria-labelledby="withdraw-title" aria-describedby="withdraw-description" dir="rtl" PaperProps={{ sx: { p: 1, m: 2, fontFamily: "'Tajawal',sans-serif", '& .MuiTypography-root, & .MuiButton-root': { fontFamily: 'inherit' }, '& .MuiButton-root': { fontSize: 14, minHeight: 44 } } }}>
      <DialogTitle id="withdraw-title" sx={{ fontSize: 22, fontWeight: 800 }}>سحب طلب التوظيف؟</DialogTitle><DialogContent><DialogContentText id="withdraw-description" sx={{ fontSize: 16, lineHeight: 1.9 }}>{(selected && typeof selected.job_id === 'object' ? selected.job_id?.title : null) || selected?.snapshot_title || 'الوظيفة غير المتاحة'} — سيُحذف طلبك، بما فيه مرفق السيرة ونسخة الإعلان المحفوظة، بعد تأكيد السحب. يمكنك التقديم مجددًا إذا كانت الوظيفة متاحة. إذا تمت مراجعته فلن يمكن سحبه.</DialogContentText></DialogContent><DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}><Button color="inherit" onClick={() => setSelected(null)}>الاحتفاظ بالطلب</Button><Button color="error" variant="contained" onClick={() => void withdraw()}>تأكيد سحب الطلب</Button></DialogActions>
    </Dialog>
  </section>;
}
