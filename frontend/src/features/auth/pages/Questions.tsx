import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import UnsavedNavigation from '../../../shared/UnsavedNavigation';
import ProgressBar from '../components/questioncomp/ProgressBar';
import PersonalStep from '../components/questioncomp/PersonalStep';
import AcademicStep from '../components/questioncomp/AcademicStep';
import LanguagesStep from '../components/questioncomp/LanguagesStep';
import ProfessionalStep from '../components/questioncomp/ProfessionalStep';
import { createQuestionsClient, QuestionsRequestError } from '../services/questionsService';
import { QUESTION_STEPS, firstQuestionsError, questionsFromProfile, questionsDestination, validQuestionsProfile, validateQuestionsStep } from '../validation/questionsValidation';
import type { QuestionsForm, QuestionErrors, QuestionStep, QuestionFieldName } from '../types/questions';
import { useAuth, type SessionUser } from '../../../shared/AuthContext';
import './Login.css';
import './Questions.css';
function responseUser(data: unknown): unknown { return data && typeof data === 'object' && 'user' in data ? data.user : undefined; }
function QuestionsEditor({ account }: { account: SessionUser }) {
  const { updateUser } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [client] = useState(createQuestionsClient);
  const [form, setForm] = useState<QuestionsForm>(() => questionsFromProfile(account as Parameters<typeof questionsFromProfile>[0]));
  const [baseline, setBaseline] = useState<QuestionsForm | null>(null);
  const [step, setStep] = useState<QuestionStep>(1); const [maxVisited, setMaxVisited] = useState<QuestionStep>(1);
  const [errors, setErrors] = useState<QuestionErrors>({}); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [attempt, setAttempt] = useState(0);
  const pending = useRef(false); const saveController = useRef<AbortController | null>(null); const heading = useRef<HTMLHeadingElement>(null);
  const dirty = baseline !== null && JSON.stringify(form) !== JSON.stringify(baseline);
  const savedNavigation = useRef(false);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setMessage('');
    void client.load(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      const profile = responseUser(data);
      if (!validQuestionsProfile(profile, account._id)) throw new Error('Invalid profile');
      const draft = questionsFromProfile(profile); setForm(draft); setBaseline(draft);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error instanceof QuestionsRequestError ? error.message : 'تعذر تحميل بياناتك المحفوظة. أعد المحاولة قبل التعديل.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [account._id, attempt, client]);
  useEffect(() => () => { saveController.current?.abort(); }, []);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  useEffect(() => { if (baseline) heading.current?.focus(); }, [step, baseline]);
  function update<K extends QuestionFieldName>(field: K, value: QuestionsForm[K]) {
    if (pending.current) return;
    setForm(previous => ({ ...previous, [field]: value })); setErrors(previous => ({ ...previous, [field]: undefined })); setMessage('');
  }
  function showErrors(nextStep: QuestionStep, nextErrors: QuestionErrors) {
    setStep(nextStep); setErrors(nextErrors);
    requestAnimationFrame(() => document.getElementById('questions-' + Object.keys(nextErrors)[0])?.focus());
  }
  function chooseStep(nextStep: QuestionStep) {
    if (pending.current || nextStep > maxVisited) return;
    if (nextStep > step) { const found = validateQuestionsStep(step, form); if (Object.keys(found).length) { showErrors(step, found); return; } }
    setErrors({}); setMessage(''); setStep(nextStep);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current || !baseline) return;
    if (step < 4) {
      const found = validateQuestionsStep(step, form); if (Object.keys(found).length) { showErrors(step, found); return; }
      const nextStep = (step + 1) as QuestionStep; setErrors({}); setStep(nextStep); setMaxVisited(previous => Math.max(previous, nextStep) as QuestionStep); return;
    }
    const first = firstQuestionsError(form); if (first) { showErrors(first.step, first.errors); return; }
    pending.current = true; setSaving(true); setMessage(''); const controller = new AbortController(); saveController.current = controller;
    try {
      const data = await client.save(form, controller.signal); if (controller.signal.aborted) return;
      const profile = responseUser(data);
      if (!validQuestionsProfile(profile, account._id) || !profile.hasCompletedQuestions) throw new Error('Invalid save response');
      updateUser(profile); setBaseline(form); savedNavigation.current = true;
      const from = location.state && typeof location.state === 'object' && 'from' in location.state ? location.state.from : undefined;
      navigate(questionsDestination(profile, from), { replace: true });
    } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof QuestionsRequestError ? error.message : 'لم نتمكن من تأكيد الحفظ. أعد المحاولة؛ بياناتك ما زالت في النموذج.'); }
    finally { if (!controller.signal.aborted) { pending.current = false; setSaving(false); } }
  }
  const props = { form, update, errors }; const info = QUESTION_STEPS[step - 1];
  return <div className="login-page questions-page" dir="rtl"><UnsavedNavigation active={() => !savedNavigation.current && (dirty || pending.current)} busy={saving} />
    <main className="questions-layout">
      <header className="questions-intro"><h1>خلّينا نتعرّف عليك.</h1><p>أكمل ملفك المهني بخطوات بسيطة. يمكنك تعديل بياناتك لاحقًا من ملفك الشخصي.</p></header>
      {loading ? <p className="questions-status" role="status">جارٍ تحميل بياناتك المحفوظة…</p> : !baseline ? <div className="questions-load-error"><p role="alert">{message}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></div>
        : <><ProgressBar step={step} maxVisited={maxVisited} onSelect={chooseStep} disabled={saving} />
          <form className="questions-form" noValidate onSubmit={submit} aria-busy={saving}>
            <div className="questions-step-heading"><p>الخطوة {step.toLocaleString('ar')} من ٤</p><h2 ref={heading} tabIndex={-1}>{info.title}</h2><p>{info.description}</p></div>
            <fieldset className="questions-controls" disabled={saving}><legend className="sr-only">{info.title}</legend>
              {step === 1 && <PersonalStep {...props} />}{step === 2 && <AcademicStep {...props} />}{step === 3 && <LanguagesStep {...props} />}{step === 4 && <ProfessionalStep {...props} />}
              {step === 4 && <details className="questions-review"><summary>راجع بياناتك قبل الحفظ</summary>
                <section><div><h3>المعلومات الشخصية</h3><button type="button" onClick={() => chooseStep(1)}>تعديل المعلومات الشخصية</button></div><dl><dt>الاسم</dt><dd>{form.fullName}</dd><dt>العمر</dt><dd>{form.age}</dd><dt>المدينة</dt><dd>{form.city}</dd></dl></section>
                <section><div><h3>التعلّم</h3><button type="button" onClick={() => chooseStep(2)}>تعديل التعلّم</button></div><dl><dt>الجامعة أو جهة التعلّم</dt><dd>{form.university || 'لم تضف جهة تعلّم'}</dd><dt>التخصص</dt><dd>{form.major || 'لم تضف تخصصًا'}</dd></dl></section>
                <section><div><h3>لغات البرمجة</h3><button type="button" onClick={() => chooseStep(3)}>تعديل اللغات</button></div><p dir="auto">{form.programmingLanguages.join('، ') || 'لم تختر لغات بعد'}</p></section>
              </details>}
            </fieldset>
            {message && <p className="questions-banner" role="alert">{message}</p>}
            <div className="questions-actions">{step > 1 && <button className="questions-back" type="button" disabled={saving} onClick={() => chooseStep((step - 1) as QuestionStep)}><ArrowRightIcon aria-hidden="true" />السابق</button>}
              <button className="questions-next" type="submit" disabled={saving}>{saving ? 'جارٍ حفظ البيانات…' : step === 4 ? 'حفظ البيانات والمتابعة' : step === 2 ? 'متابعة إلى اللغات' : step === 3 ? 'متابعة إلى الاهتمامات' : 'متابعة إلى التعلّم'}{step === 4 ? <CheckIcon aria-hidden="true" /> : <ArrowLeftIcon aria-hidden="true" />}</button>
            </div>
            <p className="questions-save-note">تُحفظ بياناتك عند الضغط على «حفظ البيانات والمتابعة» في الخطوة الأخيرة.</p>
          </form></>}
    </main></div>;
}
export default function Questions() { const { user } = useAuth(); return user ? <QuestionsEditor key={user._id} account={user} /> : null; }
