import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, EnvelopeIcon, CheckIcon } from '@heroicons/react/24/outline';
import { returnPath } from '../../../shared/navigation';
import LoginField from '../components/LoginField';
import { rememberResendDeadline } from '../validation/verification';
import SocialButtons from '../components/SocialButtons';
import { oauthFailureMessage } from '../services/oauthService';
import { validateLoginFields, type LoginErrors, type LoginFieldName } from '../validation/authValidation';
import { loginUser } from '../services/loginService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<Partial<Record<LoginFieldName, boolean>>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const submitting = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const errorBanner = useRef<HTMLDivElement>(null);
  const from = returnPath(location.state) || returnPath({ from: new URLSearchParams(location.search).get('from') });
  useEffect(() => () => { pending.current?.abort(); }, []);
  useEffect(() => { if (message) errorBanner.current?.focus(); }, [message]);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  function change(field: LoginFieldName, value: string) {
    if (field === 'email') setEmail(value); else setPassword(value);
    setMessage('');
    if (touched[field]) {
      const validation = validateLoginFields(field === 'email' ? value : email, field === 'password' ? value : password);
      setErrors(previous => ({ ...previous, [field]: validation[field] }));
    }
  }
  function blur(field: LoginFieldName) {
    setTouched(previous => ({ ...previous, [field]: true }));
    if ((field === 'email' ? email : password) || touched[field]) {
      setErrors(previous => ({ ...previous, [field]: validateLoginFields(email, password)[field] }));
    }
    if (field === 'password') setCapsLock(false);
  }
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || countdown > 0) return;
    setMessage('');
    const submitted = new FormData(event.currentTarget);
    const submittedEmail = String(submitted.get('email') || '');
    const submittedPassword = String(submitted.get('password') || '');
    setEmail(submittedEmail); setPassword(submittedPassword);
    const validation = validateLoginFields(submittedEmail, submittedPassword);
    setErrors(validation); setTouched({ email: true, password: true });
    const first = (['email', 'password'] as const).find(field => validation[field]);
    if (first) { document.getElementById('login-' + first)?.focus(); return; }
    const controller = new AbortController(); pending.current = controller;
    submitting.current = true; setLoading(true);
    try {
      const { response, data } = await loginUser(submittedEmail, submittedPassword, controller.signal);
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 401) setMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة. راجع بياناتك أو استخدم «نسيت كلمة المرور؟».');
        else if (response.status === 429) {
          setMessage('محاولات كثيرة خلال وقت قصير. انتظر قليلًا وحاول مجددًا.');
          const seconds = Number(response.headers.get('Retry-After') || 0);
          if (Number.isFinite(seconds)) setCountdown(Math.max(0, Math.min(900, Math.ceil(seconds))));
        } else if (response.status === 503) setMessage('إرسال رمز التحقق غير متاح حاليًا. حاول تسجيل الدخول لاحقًا.');
        else if (response.status === 400) setMessage('تعذر قبول البيانات. راجع البريد الإلكتروني وكلمة المرور.');
        else setMessage('تعذر تسجيل الدخول الآن. حاول مرة أخرى بعد قليل.');
        return;
      }
      if (data.requiresVerification !== true) { setMessage('لم تكتمل عملية الدخول. حاول مرة أخرى.'); return; }
      rememberResendDeadline(data.email || submittedEmail.trim().toLowerCase(), Date.now() + 60000);
      setPassword(''); setRevealed(false);
      navigate('/verify-email?email=' + encodeURIComponent(data.email || submittedEmail.trim().toLowerCase()), { state: { from } });
    } catch {
      if (!controller.signal.aborted) setMessage('تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.');
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  return <div className="login-page" dir="rtl">

    <main className="login-layout">
      <section className="login-form-section" aria-labelledby="login-title">
        <ol className="login-steps" aria-label="خطوات تسجيل الدخول"><li aria-current="step"><span>١</span>بيانات الدخول</li><li className="login-step-line" aria-hidden="true" /><li><span>٢</span>تأكيد البريد</li></ol>
        <h1 id="login-title">أهلًا بعودتك</h1>
        <p className="login-description">سجّل الدخول إلى حسابك في تطوّر، وكمّل رحلتك المهنية.</p>
        {oauthFailureMessage(new URLSearchParams(location.search).get('error')) && <p className="login-server-error" role="alert">{oauthFailureMessage(new URLSearchParams(location.search).get('error'))}</p>}
        <form className="login-form" onSubmit={handleLogin} noValidate aria-label="تسجيل الدخول" aria-busy={loading}>
          <LoginField field="email" label="البريد الإلكتروني" type="email" dir="ltr" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="name@example.com" maxLength={254}
            value={email} onChange={event => change('email', event.target.value)} onBlur={() => blur('email')} error={errors.email} disabled={loading} />
          <LoginField field="password" label="كلمة المرور" type={revealed ? 'text' : 'password'} dir="ltr" autoComplete="current-password" maxLength={128} placeholder="أدخل كلمة المرور" value={password}
            onChange={event => change('password', event.target.value)} onBlur={() => blur('password')} onKeyDown={event => setCapsLock(event.getModifierState('CapsLock'))} onKeyUp={event => setCapsLock(event.getModifierState('CapsLock'))}
            error={errors.password} revealed={revealed} onToggle={() => setRevealed(value => !value)} capsLock={capsLock} disabled={loading} />
          <Link className="login-forgot" to="/forgot-password" state={{ from }}>نسيت كلمة المرور؟</Link>
          {message && <div className="login-server-error" ref={errorBanner} tabIndex={-1} role="alert">{message}</div>}
          <button className="login-submit" type="submit" disabled={loading || countdown > 0}>
            {loading ? <><span className="login-spinner" aria-hidden="true" />جارٍ التحقق من بياناتك…</> : countdown > 0 ? `حاول مجددًا خلال ${countdown} ثانية` : <>تسجيل الدخول<ArrowLeftIcon aria-hidden="true" /></>}
          </button>
          <p className="login-verification-note"><EnvelopeIcon aria-hidden="true" />بعد التحقق من بياناتك، سنرسل رمزًا إلى بريدك لتأكيد الدخول.</p>
        </form>
        <div className="login-social"><SocialButtons /></div>
        <p className="login-signup">جديد على تطوّر؟ <Link to="/signup" state={{ from }}>أنشئ حسابًا</Link></p>
      </section>
      <aside className="login-intro" aria-labelledby="login-intro-title">
        <h2 id="login-intro-title">سيرتك، وفرصك،<br />بين يديك.</h2>
        <p>جهّز سيرتك الذاتية، واستكشف الوظائف، وتابع طلباتك من حسابك.</p>
        <div className="login-file-scene" aria-hidden="true">
          <div className="login-file-tab"><DocumentTextIcon />ملفك المهني</div>
          <div className="login-file-sheet"><div className="login-file-heading"><span /><div><b /><i /></div></div><div className="login-file-lines"><i /><i /><i /></div><div className="login-file-skills"><i /><i /><i /></div>
            <div className="login-file-bottom"><CheckIcon /><span>سيرتك الذاتية</span></div>
          </div>
        </div>
      </aside>
    </main>
  </div>;
}
