import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CITIES, EXPERIENCE_YEARS, JOB_INTERESTS, JOB_TITLES } from '../../constants/questionsData';
import { createProfileClient } from '../../services/profileService';
import { profileDraft, profilePayload, profileErrors, type ProfileDraft, type ProfileErrors } from '../../validation/profileValidation';
import type { UserProfile } from '../../types/user';
import LanguagePicker from '../LanguagePicker';
interface Props { user: UserProfile; onSaved: (user: UserProfile) => void; onCancel: () => void; onStateChange: (dirty: boolean, busy: boolean) => void }
type TextKey = Exclude<keyof ProfileDraft, 'programmingLanguages' | 'lookingForJob'>;
interface Field { key: TextKey; label: string; max: number; required?: boolean; type?: string; autoComplete?: string; options?: string[]; hint?: string }
const fields: Field[] = [
  { key: 'fullName', label: 'الاسم الكامل', max: 200, required: true, autoComplete: 'name' },
  { key: 'phone', label: 'رقم الهاتف', max: 40, type: 'tel', autoComplete: 'tel' },
  { key: 'age', label: 'العمر', max: 6, hint: 'بالسنوات، من ١ إلى ١٥٠. يمكنك تركه فارغًا.' },
  { key: 'city', label: 'المدينة', max: 100, autoComplete: 'address-level2', options: CITIES.filter(city => city !== 'أخرى') },
  { key: 'avatar', label: 'رابط الصورة الشخصية', max: 2000, type: 'url', autoComplete: 'url', hint: 'رابط مباشر يبدأ بـ http أو https. اتركه فارغًا لإزالة الصورة.' },
  { key: 'university', label: 'الجامعة أو جهة التعلّم', max: 200 }, { key: 'major', label: 'التخصص أو مجال الدراسة', max: 200 },
  { key: 'jobTitle', label: 'المسمى المهني', max: 300, options: JOB_TITLES },
  { key: 'experienceYears', label: 'سنوات الخبرة', max: 100, options: EXPERIENCE_YEARS },
  { key: 'jobInterest', label: 'الاهتمام المهني', max: 300, options: JOB_INTERESTS },
];
export default function ProfileEditor({ user, onSaved, onCancel, onStateChange }: Props) {
  const [baseline] = useState(() => profileDraft(user)); const [form, setForm] = useState(baseline);
  const [client] = useState(() => createProfileClient(user._id));
  const [errors, setErrors] = useState<ProfileErrors>({}); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  const busy = useRef(false); const controller = useRef<AbortController | null>(null); const id = useId(); const heading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { onStateChange(dirty, saving); }, [dirty, saving, onStateChange]);
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  const update = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    if (busy.current) return;
    setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); setMessage('');
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current) return;
    const invalid = profileErrors(form); setErrors(invalid); setMessage('');
    if (Object.keys(invalid).length) { requestAnimationFrame(() => document.getElementById(id + '-' + Object.keys(invalid)[0])?.focus()); return; }
    busy.current = true; setSaving(true); const request = new AbortController(); controller.current = request;
    try { const account = await client.save(profilePayload(form), request.signal); if (!request.signal.aborted) onSaved(account); }
    catch (failure) { if (!request.signal.aborted) setMessage(failure instanceof Error ? failure.message : 'تعذر حفظ التعديلات. بياناتك ما زالت في النموذج.'); }
    finally { if (!request.signal.aborted) { busy.current = false; setSaving(false); } }
  }
  function renderField(field: Field) {
    const fieldId = id + '-' + field.key; const error = errors[field.key];
    const descriptions = [field.hint && fieldId + '-hint', error && fieldId + '-error'].filter(Boolean).join(' ') || undefined;
    return <div className="profile-field" key={field.key} data-invalid={!!error}>
      <label htmlFor={fieldId}>{field.label}{!field.required && <span> اختياري</span>}</label>
      <input id={fieldId} name={field.key} value={form[field.key]} onChange={event => update(field.key, event.target.value)} type={field.type || 'text'} required={field.required} maxLength={field.max} inputMode={field.key === 'age' ? 'numeric' : undefined} list={field.options ? fieldId + '-options' : undefined} autoComplete={field.autoComplete} dir={['phone', 'avatar'].includes(field.key) ? 'ltr' : undefined} aria-invalid={!!error} aria-describedby={descriptions} />
      {field.options && <datalist id={fieldId + '-options'}>{field.options.map(value => <option key={value} value={value} />)}</datalist>}
      {field.hint && <p className="profile-hint" id={fieldId + '-hint'}>{field.hint}</p>}
      {error && <p className="profile-field-error" id={fieldId + '-error'}>{error}</p>}
    </div>;
  }
  return <form onSubmit={submit} noValidate aria-label="تعديل الملف الشخصي" aria-busy={saving} className="profile-editor">
    <div className="profile-editor-heading"><h2 ref={heading} tabIndex={-1}>تعديل ملفك</h2><p>الاسم مطلوب، وبقية الحقول اختيارية. تُحفظ التغييرات معًا عند الضغط على «حفظ التعديلات».</p></div>
    <fieldset disabled={saving} className="profile-editor-controls"><legend className="sr-only">بيانات الملف الشخصي</legend>
      <section className="profile-edit-section"><h3>البيانات الشخصية</h3><div className="profile-fields">{fields.slice(0, 5).map(renderField)}</div></section>
      <section className="profile-edit-section"><h3>التعلّم</h3><div className="profile-fields">{fields.slice(5, 7).map(renderField)}</div></section>
      <section className="profile-edit-section"><h3>لغات البرمجة</h3><p className="profile-hint">اختر اللغات أو أضف لغة غير موجودة في القائمة.</p><fieldset className="profile-language-field" id={id + '-programmingLanguages'} tabIndex={-1} aria-describedby={errors.programmingLanguages ? id + '-programmingLanguages-error' : undefined}><legend className="sr-only">لغات البرمجة</legend><LanguagePicker selected={form.programmingLanguages} onChange={value => update('programmingLanguages', value)} disabled={saving} /></fieldset>
        {errors.programmingLanguages && <p className="profile-field-error" id={id + '-programmingLanguages-error'}>{errors.programmingLanguages}</p>}
      </section>
      <section className="profile-edit-section"><h3>الاهتمامات المهنية</h3><div className="profile-fields">{fields.slice(7).map(renderField)}</div><label className="profile-looking"><input type="checkbox" checked={form.lookingForJob} onChange={event => update('lookingForJob', event.target.checked)} />أبحث عن فرصة عمل حاليًا</label></section>
    </fieldset>
    {message && <p role="alert" className="profile-error-banner">{message}</p>}
    <div className="profile-edit-actions"><button type="submit" disabled={saving} className="profile-primary">{saving ? 'جارٍ حفظ التعديلات…' : 'حفظ التعديلات'}</button><button type="button" disabled={saving} onClick={() => { if (!dirty || window.confirm('تجاهل التعديلات غير المحفوظة؟')) onCancel(); }} className="profile-secondary">إلغاء التعديل</button><span>{dirty ? 'لديك تغييرات غير محفوظة' : 'لم تُجرِ تغييرات بعد'}</span></div>
  </form>;
}
