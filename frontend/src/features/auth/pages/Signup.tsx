import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRightIcon, BriefcaseIcon, BuildingOffice2Icon, CheckIcon, DocumentTextIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import SignupField from "../components/SignupField";
import SocialButtons from "../components/SocialButtons";
import { validateSignup, type SignupErrors, type SignupFieldName, type SignupValues } from "../validation/signupValidation";
import { signupUser } from "../services/signupService";
import { rememberResendDeadline } from '../validation/verification';
import { returnPath } from '../../../shared/navigation';
import "./Signup.css";

const initialValues: SignupValues = { fullName: "", email: "", password: "", confirmPassword: "" };
const fieldOrder: SignupFieldName[] = ["fullName", "email", "password", "confirmPassword"];
export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<Partial<Record<SignupFieldName, boolean>>>({});
  const [errors, setErrors] = useState<SignupErrors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const requestInFlight = useRef(false);

  function change(field: SignupFieldName, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setMessage("");
    const validation = validateSignup(next);
    setErrors(previous => {
      const updated = { ...previous };
      for (const name of fieldOrder) if (touched[name]) updated[name] = validation[name];
      return updated;
    });
  }
  function blur(field: SignupFieldName) {
    setTouched(previous => ({ ...previous, [field]: true }));
    setErrors(previous => ({ ...previous, [field]: validateSignup(values)[field] }));
  }
  function focusFirstError(validation: SignupErrors) {
    const first = fieldOrder.find(field => validation[field]);
    if (first) document.getElementById("signup-" + first)?.focus();
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestInFlight.current) return;
    const validation = validateSignup(values);
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setErrors(validation);
    setMessage("");
    if (Object.keys(validation).length) { focusFirstError(validation); return; }
    requestInFlight.current = true;
    setLoading(true);
    try {
      const { response, data } = await signupUser(values.email, values.password, values.fullName);
      if (!response.ok) {
        if (response.status === 409) {
          const duplicate = { email: "هذا البريد مرتبط بحساب بالفعل. سجّل الدخول أو استخدم بريدًا آخر." };
          setErrors(duplicate);
          focusFirstError(duplicate);
        } else if (response.status === 429) setMessage("محاولات كثيرة خلال وقت قصير. انتظر قليلًا وحاول مجددًا.");
        else if (response.status === 503) setMessage("إنشاء الحساب غير متاح حاليًا. حاول مرة أخرى لاحقًا.");
        else if (response.status === 400) setMessage("تعذّر قبول هذه البيانات. راجع الاسم والبريد وكلمة المرور ثم حاول مجددًا.");
        else setMessage("تعذّر إنشاء الحساب الآن. حاول مرة أخرى بعد قليل.");
        return;
      }
      if (!data.requiresVerification) { setMessage("لم تكتمل عملية إنشاء الحساب. حاول مرة أخرى."); return; }
      const verifiedEmail = data.email || values.email.trim().toLowerCase();
      rememberResendDeadline(verifiedEmail, Date.now() + 60000);
      navigate("/verify-email?email=" + encodeURIComponent(verifiedEmail), { replace: true, state: { from: returnPath(location.state) } });
    } catch {
      setMessage("تعذّر الاتصال. تحقق من اتصالك بالإنترنت وحاول مجددًا.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="signup-page" dir="rtl">
      <main className="signup-layout">
        <section className="signup-form-section" aria-labelledby="signup-title">
          <ol className="signup-steps" aria-label="خطوات إنشاء الحساب">
            <li aria-current="step"><span className="signup-step-number">١</span>إنشاء الحساب</li>
            <li className="signup-step-line" aria-hidden="true" />
            <li><span className="signup-step-number">٢</span>تأكيد البريد</li>
          </ol>
          <h1 id="signup-title">أنشئ حسابك</h1>
          <p className="signup-description">أضف بياناتك الأساسية، وسنرسل رمز تحقق إلى بريدك الإلكتروني.</p>
          <form className="signup-form" onSubmit={handleSubmit} noValidate aria-label="إنشاء حساب" aria-busy={loading}>
            <SignupField field="fullName" label="الاسم الكامل" placeholder="اكتب اسمك الكامل" autoComplete="name" maxLength={200}
              value={values.fullName} onChange={event => change("fullName", event.target.value)} onBlur={() => blur("fullName")} error={errors.fullName} disabled={loading} />
            <SignupField field="email" label="البريد الإلكتروني" type="email" inputMode="email" dir="ltr" placeholder="name@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254}
              value={values.email} onChange={event => change("email", event.target.value)} onBlur={() => blur("email")} error={errors.email} disabled={loading} />
            <div className="signup-password-row">
            <SignupField field="password" label="كلمة المرور" type={showPassword ? "text" : "password"} dir="ltr" placeholder="٨ أحرف على الأقل" autoComplete="new-password" maxLength={128}
              value={values.password} onChange={event => change("password", event.target.value)} onBlur={() => blur("password")} error={errors.password} hint="استخدم ٨ أحرف على الأقل." disabled={loading}
              revealed={showPassword} onToggleVisibility={() => setShowPassword(previous => !previous)} />
            <SignupField field="confirmPassword" label="تأكيد كلمة المرور" type={showConfirmation ? "text" : "password"} dir="ltr" placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" maxLength={128}
              value={values.confirmPassword} onChange={event => change("confirmPassword", event.target.value)} onBlur={() => blur("confirmPassword")} error={errors.confirmPassword} disabled={loading}
              revealed={showConfirmation} onToggleVisibility={() => setShowConfirmation(previous => !previous)} />
            </div>
            {message && <div className="signup-server-error" role="alert">{message}</div>}
            <button className="signup-submit" type="submit" disabled={loading}>
              {loading ? <><span className="signup-spinner" aria-hidden="true" />جاري إنشاء الحساب...</> : <>إنشاء الحساب والمتابعة<ArrowRightIcon aria-hidden="true" /></>}
            </button>
            <p className="signup-next-step"><EnvelopeIcon aria-hidden="true" />الخطوة التالية: تأكيد بريدك برمز من ٥ أرقام.</p>
          </form>
          <div className="signup-social"><SocialButtons /></div>
          <p className="signup-login-link">لديك حساب بالفعل؟ <Link to="/login" state={{ from: returnPath(location.state) }}>تسجيل الدخول</Link></p>
        </section>
        <aside className="signup-intro" aria-labelledby="signup-intro-title">
          <div className="signup-intro-copy">
            <p className="signup-intro-kicker">خطوتك الأولى في تطوّر</p>
            <h2 id="signup-intro-title">مساحة واحدة<br />لمسارك المهني.</h2>
          </div>
          <div className="signup-profile-visual" aria-hidden="true">
            <div className="signup-profile-paper">
              <div className="signup-paper-heading"><span className="signup-paper-avatar">{values.fullName.trim().charAt(0) || "ت"}</span><div><strong>{values.fullName.trim() || "ملفّك المهني"}</strong><span>كل خبرة تضيفها، تصنع فرقًا</span></div></div>
              <div className="signup-paper-rule" />
              <div className="signup-paper-section"><span>نبذة عنك</span><i /><i /></div>
              <div className="signup-paper-section"><span>مهاراتك</span><div className="signup-paper-skills"><b /><b /><b /></div></div>
              <div className="signup-paper-section"><span>خبراتك وتعليمك</span><i /><i /></div>
            </div>
            <span className="signup-profile-check"><CheckIcon />خطوة بخطوة</span>
          </div>
          <ul className="signup-benefits">
            <li><DocumentTextIcon aria-hidden="true" /><span>أنشئ سيرة ذاتية تعبّر عنك</span></li>
            <li><BuildingOffice2Icon aria-hidden="true" /><span>تعرّف على الشركات والتقنيات التي تستخدمها</span></li>
            <li><BriefcaseIcon aria-hidden="true" /><span>استكشف فرص العمل في مجال التقنية</span></li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
