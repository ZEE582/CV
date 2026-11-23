import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../shared/AuthContext';
import { returnPath } from '../../../shared/navigation';
import CodeInputs from '../components/verifyemailcompo/CodeInputs';
import VerifyHeader from '../components/verifyemailcompo/VerifyHeader';
import { verifyCode } from '../services/verifyService';
import { resendCode } from '../services/resendCodeService';
import { clearResendDeadline, normalizeVerificationCode, readResendDeadline, rememberResendDeadline, retrySeconds, validVerificationEmail, validVerificationReply, verificationDestination } from '../validation/verification';
import './Login.css';
import './VerifyEmail.css';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const location = useLocation();
  const email = (params.get('email') || '').trim().toLowerCase();
  const from = returnPath(location.state) || returnPath({ from: new URLSearchParams(location.search).get('from') });
  return <div className="login-page verify-page" dir="rtl">
    <main className="verify-layout">
      {validVerificationEmail(email) ? <VerificationPanel key={email} email={email} from={from} /> : <section className="verify-panel verify-start" aria-labelledby="verify-title">
        <h1 id="verify-title">ابدأ بطلب رمز التحقق</h1>
        <p>سجّل الدخول أو أنشئ حسابًا حتى يصلك رمز تأكيد إلى بريدك الإلكتروني.</p>
        <Link className="login-submit" to="/login" state={{ from }}>تسجيل الدخول<ArrowLeftIcon aria-hidden="true" /></Link>
        <Link className="verify-back" to="/signup" state={{ from }}>إنشاء حساب جديد</Link>
      </section>}
    </main>
  </div>;
}
function VerificationPanel({ email, from }: { email: string; from?: string }) {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState<'verify' | 'resend' | null>(null);
  const [resendAt, setResendAt] = useState(() => readResendDeadline(email));
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const resendRemaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const blockedRemaining = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => { rememberResendDeadline(email, resendAt); }, [email, resendAt]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (message && isError) messageRef.current?.focus(); }, [message, isError]);
  function showMessage(text: string, error = true) { setMessage(text); setIsError(error); }
  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || blockedRemaining > 0) return;
    const entered = normalizeVerificationCode(String(new FormData(event.currentTarget).get('code') || ''));
    setCode(entered); setMessage('');
    if (entered.length !== 5) { setFieldError('أدخل رمز التأكيد كاملًا، المكوّن من ٥ أرقام.'); inputRef.current?.focus(); return; }
    const request = new AbortController(); controller.current = request;
    pending.current = true; setBusy('verify'); setFieldError('');
    try {
      const { response, data } = await verifyCode(email, entered, request.signal);
      if (request.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 429) {
          setBlockedUntil(Date.now() + retrySeconds(response) * 1000);
          showMessage('محاولات كثيرة خلال وقت قصير. انتظر قبل المحاولة مجددًا.');
        } else if (response.status === 400) showMessage('الرمز غير صحيح أو انتهت صلاحيته. راجع أحدث رسالة، أو ابدأ تسجيل الدخول مجددًا.');
        else if (response.status === 401 || response.status === 403) showMessage('تعذر تأكيد هذا الحساب. ارجع لتسجيل الدخول وابدأ من جديد.');
        else showMessage('تعذر تأكيد الرمز الآن. حاول بعد قليل.');
        return;
      }
      if (!validVerificationReply(data, email)) { showMessage('لم يكتمل تأكيد الدخول. حاول تسجيل الدخول مجددًا.'); return; }
      clearResendDeadline(email);
      completeLogin(data.token, data.user);
      const destination = verificationDestination(data.user, from);
      navigate(destination.path, { replace: true, state: destination.state });
    } catch { if (!request.signal.aborted) showMessage('تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.'); }
    finally { pending.current = false; if (!request.signal.aborted) setBusy(null); }
  }
  async function handleResend() {
    if (pending.current || resendRemaining > 0 || blockedRemaining > 0) return;
    const request = new AbortController(); controller.current = request;
    pending.current = true; setBusy('resend'); setMessage('');
    try {
      const { response } = await resendCode(email, request.signal);
      if (request.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 429) {
          setResendAt(Date.now() + retrySeconds(response) * 1000);
          showMessage('انتظر قبل إعادة الإرسال. إذا انتهت صلاحية الطلب، ارجع لتسجيل الدخول.');
        } else if (response.status === 401 || response.status === 400) showMessage('ابدأ بتسجيل الدخول أو إنشاء حساب من هذا المتصفح لطلب رمز جديد.');
        else if (response.status === 503) showMessage('إرسال البريد غير متاح حاليًا. حاول لاحقًا.');
        else showMessage('تعذر إعادة الإرسال الآن. حاول بعد قليل.');
        return;
      }
      setResendAt(Date.now() + 60000); setCode(''); setFieldError('');
      showMessage('أُعيد إرسال الرمز. استخدم أحدث رسالة في بريدك.', false);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch { if (!request.signal.aborted) showMessage('تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.'); }
    finally { pending.current = false; if (!request.signal.aborted) setBusy(null); }
  }
  return <section className="verify-panel" aria-labelledby="verify-title">
    <ol className="login-steps verify-steps" aria-label="خطوات تأكيد البريد">
      <li><span>١</span>بيانات الحساب</li><li className="login-step-line" aria-hidden="true" /><li aria-current="step"><span>٢</span>تأكيد البريد</li>
    </ol>
    <VerifyHeader email={email} from={from} />
    <form className="verify-form" onSubmit={handleVerify} noValidate aria-label="تأكيد البريد الإلكتروني" aria-busy={!!busy}>
      <CodeInputs value={code} inputRef={inputRef} disabled={!!busy} error={fieldError} onChange={value => { setCode(value); setFieldError(''); setMessage(''); }} />
      {message && <div ref={messageRef} tabIndex={-1} role={isError ? 'alert' : 'status'} className={isError ? 'login-server-error' : 'verify-success'}>{message}</div>}
      <button className="login-submit" type="submit" disabled={!!busy || blockedRemaining > 0}>
        {busy === 'verify' ? <><span className="login-spinner" aria-hidden="true" />جارٍ تأكيد الرمز…</> : blockedRemaining > 0 ? `حاول بعد ${blockedRemaining} ثانية` : <>تأكيد البريد والمتابعة<ArrowLeftIcon aria-hidden="true" /></>}
      </button>
    </form>
    <div className="verify-resend">
      <p>لم تصلك الرسالة؟ تفقد البريد غير المرغوب فيه.</p>
      <button type="button" onClick={() => void handleResend()} disabled={!!busy || resendRemaining > 0 || blockedRemaining > 0}>
        {busy === 'resend' ? 'جارٍ إعادة الإرسال…' : 'إعادة إرسال الرمز'}
      </button>
      {resendRemaining > 0 && <span className="verify-countdown">يمكن إعادة الإرسال خلال {resendRemaining} ثانية</span>}
    </div>
    <p className="verify-expiry-note">إذا انتهت صلاحية الرمز، ابدأ تسجيل الدخول من جديد. استخدم المتصفح الذي طلبت الرمز منه.</p>
  </section>;
}
