import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../shared/AuthContext';
import { returnPath } from '../../../shared/navigation';
import RecoveryField from '../components/RecoveryField';
import { RecoveryRequestError, requestPasswordReset, resetPassword } from '../services/passwordRecoveryService';
import { clearRecoveryDeadline, normalizeRecoveryCode, recoveryDeadline, rememberRecoveryDeadline, validRecoveryEmail, validateRecovery, type RecoveryErrors, type RecoveryFieldName, type RecoveryValues } from '../validation/passwordRecoveryValidation';
import './Login.css';
import './PasswordRecovery.css';

export default function PasswordRecovery() {
  const location = useLocation();
  const [params] = useSearchParams();
  const email = (params.get('email') || '').trim().toLowerCase();
  const resetting = location.pathname === '/reset-password';
  const from = returnPath(location.state);
  return <div className={'login-page recovery-page' + (resetting ? ' recovery-reset' : '')} dir="rtl">
    <main className="recovery-layout">
      {resetting && !validRecoveryEmail(email) ? <section className="recovery-start" aria-labelledby="recovery-title">
        <span className="recovery-icon" aria-hidden="true"><KeyIcon /></span>
        <h1 id="recovery-title">ابدأ بطلب الاستعادة</h1>
        <p>أدخل بريدك في صفحة الاستعادة أولًا، ثم استخدم الرمز الذي يصلك في المتصفح نفسه.</p>
        <Link className="login-submit" to="/forgot-password" state={{ from }}>طلب رمز الاستعادة<ArrowLeftIcon aria-hidden="true" /></Link>
        <Link className="recovery-back" to="/login" state={{ from }}>العودة لتسجيل الدخول</Link>
      </section> : <RecoveryForm key={location.pathname + '|' + email} resetting={resetting} initialEmail={email} from={from} />}
    </main>
  </div>;
}
function RecoveryForm({ resetting, initialEmail, from }: { resetting: boolean; initialEmail: string; from?: string }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [values, setValues] = useState<RecoveryValues>({ email: initialEmail, code: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<RecoveryErrors>({});
  const [touched, setTouched] = useState<Partial<Record<RecoveryFieldName, boolean>>>({});
  const [revealed, setRevealed] = useState({ password: false, confirmation: false });
  const [busy, setBusy] = useState<'request' | 'reset' | null>(null);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);
  const [deadline, setDeadline] = useState(() => recoveryDeadline(initialEmail));
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const normalizedEmail = values.email.trim().toLowerCase();
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const blocked = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => { setDeadline(recoveryDeadline(normalizedEmail)); }, [normalizedEmail]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (message) messageRef.current?.focus(); }, [message]);
  function change(field: RecoveryFieldName, value: string) {
    const next = { ...values, [field]: field === 'code' ? normalizeRecoveryCode(value) : value };
    setValues(next); setMessage(''); setNotice('');
    const validation = validateRecovery(next, resetting);
    setErrors(previous => {
      const updated = { ...previous };
      for (const key of Object.keys(touched) as RecoveryFieldName[]) if (touched[key]) updated[key] = validation[key];
      return updated;
    });
  }
  function blur(field: RecoveryFieldName) {
    setTouched(previous => ({ ...previous, [field]: true }));
    if (values[field] || touched[field]) setErrors(previous => ({ ...previous, [field]: validateRecovery(values, resetting)[field] }));
  }
  function focusError(validation: RecoveryErrors) {
    const first = (['email', 'code', 'password', 'confirmation'] as const).find(field => validation[field]);
    if (first) document.getElementById('recovery-' + first)?.focus();
  }
  function cooldown(email: string, seconds: number) {
    const until = Date.now() + seconds * 1000;
    rememberRecoveryDeadline(email, until); setDeadline(until);
  }
  async function requestCode(email: string) {
    if (pending.current || remaining > 0 || blocked > 0) return;
    const validation = validateRecovery({ ...values, email }, false);
    setErrors(previous => ({ ...previous, email: validation.email })); setTouched(previous => ({ ...previous, email: true }));
    if (validation.email) { focusError(validation); return; }
    const normalized = email.trim().toLowerCase();
    const request = new AbortController(); controller.current = request;
    pending.current = true; setBusy('request'); setMessage(''); setNotice('');
    try {
      const result = await requestPasswordReset(normalized, request.signal);
      if (request.signal.aborted) return;
      cooldown(normalized, result.retry_after);
      if (!resetting) navigate('/reset-password?email=' + encodeURIComponent(normalized), { state: { from } });
      else { setNotice(result.message); setValues(current => ({ ...current, code: '' })); setErrors(previous => ({ ...previous, code: undefined })); }
    } catch (failure) {
      if (request.signal.aborted) return;
      setMessage(failure instanceof RecoveryRequestError ? failure.message : 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.');
      if (failure instanceof RecoveryRequestError && failure.retryAfter > 0) cooldown(normalized, failure.retryAfter);
    } finally { pending.current = false; if (!request.signal.aborted) setBusy(null); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || blocked > 0) return;
    const form = new FormData(event.currentTarget);
    if (!resetting) { const email = String(form.get('email') || ''); setValues(current => ({ ...current, email })); await requestCode(email); return; }
    const current: RecoveryValues = { email: normalizedEmail, code: normalizeRecoveryCode(String(form.get('code') || '')), password: String(form.get('password') || ''), confirmation: String(form.get('confirmation') || '') };
    setValues(current); setMessage(''); setNotice('');
    const validation = validateRecovery(current, true);
    setErrors(validation); setTouched({ email: true, code: true, password: true, confirmation: true });
    if (Object.keys(validation).length) { focusError(validation); return; }
    const request = new AbortController(); controller.current = request;
    pending.current = true; setBusy('reset');
    try {
      const result = await resetPassword(current.email, current.code, current.password, request.signal);
      if (request.signal.aborted) return;
      clearRecoveryDeadline(current.email); logout();
      setValues({ email: current.email, code: '', password: '', confirmation: '' }); setRevealed({ password: false, confirmation: false });
      setNotice(result.message); setSuccess(true);
    } catch (failure) {
      if (request.signal.aborted) return;
      setMessage(failure instanceof RecoveryRequestError ? failure.message : 'تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.');
      if (failure instanceof RecoveryRequestError && failure.retryAfter > 0) setBlockedUntil(Date.now() + failure.retryAfter * 1000);
    } finally { pending.current = false; if (!request.signal.aborted) setBusy(null); }
  }
  if (success) return <section className="recovery-success" aria-labelledby="recovery-title">
    <span className="recovery-icon" aria-hidden="true"><CheckCircleIcon /></span>
    <h1 id="recovery-title">تم تغيير كلمة المرور</h1><p role="status">{notice}</p>
    <Link className="login-submit" to="/login" state={{ from }}>الدخول بالكلمة الجديدة<ArrowLeftIcon aria-hidden="true" /></Link>
    <p className="recovery-hint">تحتاج تأكيد الدخول برمز جديد من البريد.</p>
  </section>;
  return <section className="recovery-panel" aria-labelledby="recovery-title">
    <ol className="login-steps recovery-steps" aria-label="خطوات استعادة كلمة المرور"><li aria-current={!resetting ? 'step' : undefined}><span>١</span>طلب الرمز</li><li className="login-step-line" aria-hidden="true" /><li aria-current={resetting ? 'step' : undefined}><span>٢</span>كلمة جديدة</li></ol>
    <header className="recovery-heading"><span className="recovery-icon" aria-hidden="true"><KeyIcon /></span>
      <h1 id="recovery-title">{resetting ? 'كلمة مرور جديدة' : 'نسيت كلمة المرور؟'}</h1>
      <p>{resetting ? 'استخدم رمز الاستعادة وكلمة جديدة للعودة إلى حسابك.' : 'أدخل بريد حسابك لطلب رمز استعادة كلمة المرور.'}</p>
    </header>
    {resetting && <div className="recovery-email-row"><bdi dir="ltr">{normalizedEmail}</bdi><Link to={'/forgot-password?email=' + encodeURIComponent(normalizedEmail)} state={{ from }}>تغيير البريد</Link></div>}
    <form className="recovery-form" onSubmit={submit} noValidate aria-label={resetting ? 'تعيين كلمة المرور' : 'طلب استعادة كلمة المرور'} aria-busy={!!busy}>
      {!resetting ? <RecoveryField field="email" label="البريد الإلكتروني" type="email" dir="ltr" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="name@example.com" value={values.email} onChange={event => change('email', event.target.value)} onBlur={() => blur('email')} error={errors.email} disabled={!!busy} /> : <>
        <RecoveryField field="code" label="رمز الاستعادة (٦ أرقام)" type="text" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={32} placeholder="— — — — — —" value={values.code} onChange={event => change('code', event.target.value)} onBlur={() => blur('code')} error={errors.code} hint="يمكنك لصق الرمز كاملًا بالأرقام العربية أو الإنجليزية." disabled={!!busy} />
        <div className="recovery-passwords"><RecoveryField field="password" label="كلمة المرور الجديدة" type={revealed.password ? 'text' : 'password'} dir="ltr" autoComplete="new-password" maxLength={128} placeholder="٨ أحرف على الأقل" value={values.password} onChange={event => change('password', event.target.value)} onBlur={() => blur('password')} error={errors.password} disabled={!!busy} revealed={revealed.password} onToggle={() => setRevealed(current => ({ ...current, password: !current.password }))} />
          <RecoveryField field="confirmation" label="تأكيد كلمة المرور الجديدة" type={revealed.confirmation ? 'text' : 'password'} dir="ltr" autoComplete="new-password" maxLength={128} placeholder="أعد كتابة الكلمة الجديدة" value={values.confirmation} onChange={event => change('confirmation', event.target.value)} onBlur={() => blur('confirmation')} error={errors.confirmation} disabled={!!busy} revealed={revealed.confirmation} onToggle={() => setRevealed(current => ({ ...current, confirmation: !current.confirmation }))} />
        </div>
      </>}
      {message && <div className="login-server-error" role="alert" tabIndex={-1} ref={messageRef}>{message}</div>}
      {notice && <div className="recovery-notice" role="status">{notice}</div>}
      <button type="submit" className="login-submit" disabled={!!busy || blocked > 0 || (!resetting && remaining > 0)}>
        {busy === 'request' && !resetting ? <><span className="login-spinner" aria-hidden="true" />جارٍ طلب الرمز…</> : busy === 'reset' ? <><span className="login-spinner" aria-hidden="true" />جارٍ تعيين الكلمة…</> : blocked > 0 ? `حاول بعد ${blocked} ثانية` : !resetting && remaining > 0 ? `يمكن الطلب خلال ${remaining} ثانية` : <>{resetting ? 'حفظ كلمة المرور الجديدة' : 'طلب رمز الاستعادة'}<ArrowLeftIcon aria-hidden="true" /></>}
      </button>
    </form>
    {resetting ? <div className="recovery-resend"><p>استخدم أحدث رسالة ومن المتصفح الذي طلبت الرمز منه.</p>
      <button type="button" onClick={() => void requestCode(normalizedEmail)} disabled={!!busy || remaining > 0 || blocked > 0}>{busy === 'request' ? 'جارٍ طلب رمز جديد…' : 'طلب رمز جديد لهذا البريد'}</button>
      {remaining > 0 && <span>يمكن طلب رمز جديد خلال {remaining} ثانية</span>}
      <p className="recovery-expiry">الرمز صالح ١٠ دقائق ولمرة واحدة. طلب رمز جديد يلغي السابق.</p>
    </div> : <p className="recovery-provider-note">إذا كنت تدخل بواسطة <bdi>Google</bdi> أو <bdi>GitHub</bdi> أو <bdi>LinkedIn</bdi>، استعد حسابك من مزود تسجيل الدخول.</p>}
    <Link className="recovery-back" to="/login" state={{ from }}><ArrowRightIcon aria-hidden="true" />العودة لتسجيل الدخول</Link>
  </section>;
}
