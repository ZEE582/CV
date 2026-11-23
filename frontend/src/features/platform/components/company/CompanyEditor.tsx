import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { CompanyManagementError, type CompanyManagementClient, type ManagedCompany } from '../../api/companyManagement';
import { companyDraft, companyErrors, companyPayload, type CompanyDraft } from '../../utils/companyManagement';
export default function CompanyEditor({ original, client, onSaved, onCancel }: { original?: ManagedCompany; client: CompanyManagementClient; onSaved: (id: string) => void; onCancel: () => void }) {
  const [baseline] = useState(() => companyDraft(original)); const [form, setForm] = useState(baseline); const [errors, setErrors] = useState<ReturnType<typeof companyErrors>>({});
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [blocked, setBlocked] = useState(false); const pending = useRef(false); const controller = useRef<AbortController | null>(null); const heading = useRef<HTMLHeadingElement>(null); const id = useId();
  const changed = original ? Object.keys(companyPayload(form, original)).length > 0 : JSON.stringify(form) !== JSON.stringify(baseline);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (!changed && !busy) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [changed, busy]);
  function update<K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) { if (pending.current) return; setForm(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); if (!blocked) setMessage(''); }
  function cancel() { if (!changed || window.confirm('تجاهل بيانات الشركة غير المحفوظة؟')) onCancel(); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current || blocked) return;
    const element = event.currentTarget; const data = new FormData(element); const current = Object.fromEntries(Object.entries(baseline).map(([key, value]) => [key, typeof value === 'boolean' ? data.has(key) : String(data.get(key) || '')])) as unknown as CompanyDraft;
    setForm(current); const invalid = companyErrors(current); setErrors(invalid); setMessage(''); const first = Object.keys(invalid)[0]; if (first) { element.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return; }
    pending.current = true; setBusy(true); const request = new AbortController(); controller.current = request;
    try { const saved = await client.save(companyPayload(current, original), original, request.signal); if (!request.signal.aborted) onSaved(saved); }
    catch (failure) { if (!request.signal.aborted) { setMessage(failure instanceof Error ? failure.message : 'تعذر تأكيد الحفظ. راجع القائمة.'); setBlocked(failure instanceof CompanyManagementError && (failure.uncertain || failure.status === 409)); } }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  const field = (key: Exclude<keyof CompanyDraft, 'is_active' | 'is_verified'>, maxLength: number) => ({ id: id + key, name: key, value: form[key], disabled: busy, error: !!errors[key], helperText: errors[key], inputProps: { maxLength, ...(['website', 'email', 'name_en'].includes(key) ? { dir: 'ltr' } : {}) }, autoComplete: 'off', onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value) });
  return <Box component="form" onSubmit={event => void submit(event)} noValidate aria-busy={busy} sx={{ my: 3, p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Typography component="h2" variant="h5" fontWeight={700} tabIndex={-1} ref={heading}>{original ? 'تعديل بيانات ' + original.name_ar : 'إضافة شركة'}</Typography><Typography color="text.secondary" my={2}>اسم الشركة والنبذة مطلوبان. حفظ البيانات مستقل عن إنشاء حساب مسؤول الشركة.</Typography>
    {message && <Alert severity="error" sx={{ my: 2 }}>{message}{blocked && ' احتفظ ببياناتك ثم أغلق النموذج وحدّث القائمة قبل إعادة المحاولة.'}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
      <TextField label="اسم الشركة" required {...field('name_ar', 200)} /><TextField label="الاسم بالإنجليزية (اختياري)" {...field('name_en', 200)} />
      <TextField label="المدينة أو الموقع (اختياري)" {...field('location', 200)} /><TextField label="القطاع (اختياري)" {...field('sector', 200)} />
      <TextField label="الموقع الإلكتروني (اختياري)" type="url" {...field('website', 2048)} /><TextField label="بريد تواصل الشركة (اختياري)" type="email" {...field('email', 254)} />
      <TextField label="نبذة عن الشركة" required multiline minRows={4} {...field('about_ar', 10000)} helperText={errors.about_ar || 'من 10 إلى 10000 حرف.'} sx={{ gridColumn: '1 / -1' }} />
    </Box>
    <Box display="flex" flexDirection="column" my={2}><FormControlLabel control={<Checkbox name="is_active" checked={form.is_active} disabled={busy} onChange={event => update('is_active', event.target.checked)} />} label="الشركة مفعّلة وتظهر للجمهور" /><Typography color="text.secondary">إيقاف الشركة يخفي صفحتها ووظائفها عن الجمهور ويوقف استقبال الرسائل والتقديم، مع الاحتفاظ ببياناتها السابقة.</Typography><FormControlLabel control={<Checkbox name="is_verified" checked={form.is_verified} disabled={busy} onChange={event => update('is_verified', event.target.checked)} />} label="الشركة موثّقة بعد مراجعة بياناتها" /></Box>
    <Box display="flex" flexWrap="wrap" gap={2}><Button type="submit" color="secondary" variant="contained" disabled={busy || blocked || (!!original && !changed)}>{busy ? 'جارٍ الحفظ…' : original ? 'حفظ التعديل' : 'إضافة الشركة'}</Button><Button color="inherit" disabled={busy} onClick={cancel}>إلغاء</Button></Box>
  </Box>;
}
