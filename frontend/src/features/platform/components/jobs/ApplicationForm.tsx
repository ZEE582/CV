import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, type SessionUser } from '../../../../shared/AuthContext';
import { applicationStatuses, type ApplicationStatus } from '../../api/recruitment';
import { createApplicationClient } from '../../api/applicationClient';
import { validateApplication, type ApplicationDraft, type ApplicationErrors } from '../../utils/applicationValidation';
import { isJobOpen } from '../../utils/jobsSearch';
import type { Job } from '../../types';
import './Recruitment.css';
export default function ApplicationForm({ job }: { job: Job }) {
  const { user } = useAuth(); return <ApplicationEditor key={job._id + ':' + (user?._id || 'guest') + ':' + user?.role} job={job} user={user} />;
}
export function ApplicationEditor({ job, user, clientOverride }: { job: Job; user: SessionUser | null; clientOverride?: ReturnType<typeof createApplicationClient> }) {
  const location = useLocation(); const id = useId();
  const [client] = useState(() => clientOverride || (user?.role === 'seeker' ? createApplicationClient(user._id, job._id) : null));
  const [form, setForm] = useState<ApplicationDraft>({ cover: '', cvUrl: '', cvFile: null }); const [errors, setErrors] = useState<ApplicationErrors>({});
  const [source, setSource] = useState<'file' | 'link' | 'none'>('file'); const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ApplicationStatus | null>(null); const [loading, setLoading] = useState(!!client);
  const [checkError, setCheckError] = useState(''); const [sendError, setSendError] = useState(''); const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0); const pending = useRef(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!client) return;
    const request = new AbortController(); setLoading(true); setCheckError(''); setStatus(null); setSendError('');
    void client.status(request.signal).then(value => { if (!request.signal.aborted) setStatus(value); })
      .catch(() => { if (!request.signal.aborted) setCheckError('تعذر التحقق من طلباتك السابقة. أعد التحقق قبل التقديم.'); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [client, retry]);
  useEffect(() => () => controller.current?.abort(), []);
  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current || loading || status || checkError || sendError || !client || !isJobOpen(job)) return;
    const invalid = validateApplication(form); setErrors(invalid);
    if (Object.keys(invalid).length) { document.getElementById(id + '-' + Object.keys(invalid)[0])?.focus(); return; }
    pending.current = true; setBusy(true); const request = new AbortController(); controller.current = request;
    try { await client.submit(form, request.signal); if (!request.signal.aborted) { setForm({ cover: '', cvUrl: '', cvFile: null }); setStatus('pending'); } }
    catch (failure) { if (!request.signal.aborted) setSendError(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : 'تعذر تأكيد إرسال الطلب. تحقق من الحالة قبل إعادة المحاولة.'); }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  if (status) return <div className="application-panel"><p role="status">تم تقديم طلبك. الحالة: {applicationStatuses[status]}</p><Link to="/applications">متابعة تقديماتي</Link></div>;
  if (!isJobOpen(job)) return <p className="application-panel">انتهى التقديم على هذه الوظيفة.</p>;
  if (!user) return <div className="application-panel"><p>سجّل الدخول بحساب باحث عن عمل للتقديم.</p><Link to="/login" state={{ from: location }}>تسجيل الدخول والتقديم</Link></div>;
  if (user.role !== 'seeker') return <div className="application-panel"><p>التقديم متاح لحسابات الباحثين عن عمل.</p></div>;
  if (loading) return <p role="status" className="application-panel">جارٍ التحقق من طلباتك…</p>;
  return <form className="application-panel" noValidate aria-busy={busy} onSubmit={event => void apply(event)}><h4>التقديم على الوظيفة</h4><p>سيظهر اسمك وبريدك وبيانات الطلب للشركة.</p>
    <fieldset disabled={busy || !!checkError || !!sendError}><legend className="sr-only">بيانات طلب التوظيف</legend>
      <label htmlFor={id + '-cover'}>رسالة التقديم (اختيارية)</label><textarea id={id + '-cover'} name="cover_letter" rows={4} maxLength={10000} value={form.cover} aria-invalid={!!errors.cover} aria-describedby={errors.cover ? id + '-cover-error' : undefined} onChange={event => { setForm(previous => ({ ...previous, cover: event.target.value })); setErrors(previous => ({ ...previous, cover: undefined })); }} />
      {errors.cover && <p className="application-field-error" id={id + '-cover-error'}>{errors.cover}</p>}
      <label htmlFor={id + '-source'}>إرفاق السيرة الذاتية (اختياري)</label><select id={id + '-source'} value={source} onChange={event => { setSource(event.target.value as typeof source); setForm(previous => ({ ...previous, cvUrl: '', cvFile: null })); setErrors({}); }}><option value="file">رفع ملف PDF من الجهاز</option><option value="link">إضافة رابط للسيرة</option><option value="none">بدون سيرة مرفقة</option></select>
      {source === 'file' && <><label htmlFor={id + '-cvFile'}>ملف PDF، حتى 5 ميغابايت</label><input ref={fileInput} id={id + '-cvFile'} name="cv_file" type="file" accept=".pdf,application/pdf" aria-invalid={!!errors.cvFile} aria-describedby={id + '-file-note' + (errors.cvFile ? ' ' + id + '-cvFile-error' : '')} onChange={event => { setForm(previous => ({ ...previous, cvFile: event.target.files?.[0] || null })); setErrors(previous => ({ ...previous, cvFile: undefined })); }} /><p id={id + '-file-note'}>يُحفظ الملف مع طلبك، ويمكنك أنت والشركة المعنية ومدير المنصة تنزيله. سحب الطلب يحذف مرفقه أيضًا.</p>{form.cvFile && <div className="application-file-selection"><span>{form.cvFile.name} · {(form.cvFile.size / 1024).toLocaleString('ar', { maximumFractionDigits: 0 })} كيلوبايت</span><button type="button" onClick={() => { setForm(previous => ({ ...previous, cvFile: null })); if (fileInput.current) fileInput.current.value = ''; setErrors(previous => ({ ...previous, cvFile: undefined })); }}>إزالة الملف</button></div>}{errors.cvFile && <p className="application-field-error" id={id + '-cvFile-error'}>{errors.cvFile}</p>}</>}
      {source === 'link' && <><label htmlFor={id + '-cvUrl'}>رابط السيرة الذاتية</label><input id={id + '-cvUrl'} name="cv_url" type="url" dir="ltr" maxLength={2048} placeholder="https://example.com/resume.pdf" value={form.cvUrl} aria-invalid={!!errors.cvUrl} aria-describedby={errors.cvUrl ? id + '-cvUrl-error' : undefined} onChange={event => { setForm(previous => ({ ...previous, cvUrl: event.target.value })); setErrors(previous => ({ ...previous, cvUrl: undefined })); }} />{errors.cvUrl && <p className="application-field-error" id={id + '-cvUrl-error'}>{errors.cvUrl}</p>}</>}
    </fieldset>
    {(checkError || sendError) && <div role="alert"><p>{checkError || sendError}</p><button type="button" disabled={busy} onClick={() => setRetry(value => value + 1)}>التحقق قبل إعادة المحاولة</button></div>}
    <button type="submit" disabled={busy || !!checkError || !!sendError}>{busy ? 'جارٍ إرسال الطلب…' : 'إرسال طلب التوظيف'}</button>
  </form>;
}
