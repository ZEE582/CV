import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { submitContact } from '../../api/contactService';
import { contactErrors, contactPayload, emptyContact, type ContactDraft } from '../../utils/contactValidation';
import './ContactForm.css';
interface Props { companyId: string; companyName: string; color: string }
export default function ContactForm(props: Props) { return <CompanyContact key={props.companyId} {...props} />; }
function CompanyContact({ companyId, companyName, color }: Props) {
  const id = useId(); const [draft, setDraft] = useState<ContactDraft>({ ...emptyContact });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDraft, string>>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const pending = useRef(false); const controller = useRef<AbortController | null>(null); const attempt = useRef<{ body: string; id: string } | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current) return;
    const form = event.currentTarget; const data = new FormData(form);
    const current = Object.fromEntries(Object.keys(emptyContact).map(key => [key, String(data.get(key) || '')])) as unknown as ContactDraft;
    setDraft(current); setNotice(''); setError(''); const invalid = contactErrors(current); setErrors(invalid);
    const first = Object.keys(invalid)[0]; if (first) { form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    const payload = contactPayload(companyId, current); const body = JSON.stringify(payload);
    if (attempt.current?.body !== body) attempt.current = { body, id: crypto.randomUUID() };
    const request = new AbortController(); controller.current = request; pending.current = true; setBusy(true);
    try { await submitContact(payload, attempt.current.id, request.signal); if (!request.signal.aborted) { setDraft({ ...emptyContact }); attempt.current = null; setNotice('تم حفظ رسالتك في صندوق رسائل الشركة. ستتمكن الشركة من التواصل معك عبر البيانات التي أدخلتها.'); } }
    catch (failure) { if (!request.signal.aborted) setError(failure instanceof Error ? failure.message : 'تعذر تأكيد حفظ الرسالة. أعد المحاولة.'); }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  const fields: { key: keyof ContactDraft; label: string; type?: string; max: number; autoComplete?: string; dir?: 'ltr' }[] = [
    { key: 'name', label: 'الاسم الكامل *', max: 200, autoComplete: 'name' }, { key: 'email', label: 'البريد الإلكتروني *', type: 'email', max: 254, autoComplete: 'email', dir: 'ltr' },
    { key: 'phone', label: 'رقم الهاتف (اختياري)', type: 'tel', max: 40, autoComplete: 'tel', dir: 'ltr' }, { key: 'subject', label: 'الموضوع (اختياري)', max: 200 },
  ];
  return <section className="company-contact" dir="rtl"><h2>تواصل مع {companyName}</h2><p>اكتب استفسارك وسنحفظه في صندوق رسائل الشركة.</p>
    <form onSubmit={event => void send(event)} noValidate aria-busy={busy}><fieldset disabled={busy}><legend className="contact-sr-only">بيانات التواصل والرسالة</legend><div className="contact-grid">
      {fields.map(field => <div key={field.key}><label htmlFor={id + field.key}>{field.label}</label><input id={id + field.key} name={field.key} type={field.type || 'text'} autoComplete={field.autoComplete} maxLength={field.max} dir={field.dir} required={field.key === 'name' || field.key === 'email'} value={draft[field.key]} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? id + field.key + '-error' : undefined} onChange={event => { setDraft(previous => ({ ...previous, [field.key]: event.target.value })); setNotice(''); }} />{errors[field.key] && <span className="contact-error" id={id + field.key + '-error'}>{errors[field.key]}</span>}</div>)}
    </div><label htmlFor={id + 'message'}>الرسالة *</label><textarea id={id + 'message'} name="message" required minLength={10} maxLength={5000} rows={5} value={draft.message} aria-invalid={!!errors.message} aria-describedby={id + 'message-help'} onChange={event => { setDraft(previous => ({ ...previous, message: event.target.value })); setNotice(''); }} /><div id={id + 'message-help'} className={errors.message ? 'contact-error' : 'contact-help'}>{errors.message || 'من 10 إلى 5000 حرف.'} <span>{draft.message.length} / 5000</span></div>
    <p className="contact-help">تظهر بيانات التواصل ورسالتك للشركة. إرسال النموذج لا يرسل بريدًا إلكترونيًا تلقائيًا.</p><button type="submit" style={{ backgroundColor: /^#[\da-f]{6}$/i.test(color) ? color : '#6254dc' }}>{busy ? 'جارٍ حفظ الرسالة…' : 'إرسال الرسالة'}</button></fieldset>
    {error && <p className="contact-error contact-feedback" role="alert">{error}</p>}{notice && <p className="contact-success contact-feedback" role="status">{notice}</p>}
    </form></section>;
}
