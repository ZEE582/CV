import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import { JobManagementError, type JobManagementClient } from '../../api/jobManagement';
import { JOB_TYPES, EXPERIENCE_LEVELS, REGIONS, FIELDS, CURRENCIES } from '../../utils/jobsSearch';
import { DEADLINE_TIME_ZONE, jobDraft, jobEditorErrors, jobEditorPayload, type JobDraft, type JobEditorErrors } from '../../utils/jobEditorValidation';
import type { Job } from '../../types';
interface Props { companyId: string; companyActive: boolean; job?: Job; client: JobManagementClient; onSaved: () => void; onCancel: () => void; onStateChange: (dirty: boolean, busy: boolean) => void }
export default function JobEditor({ companyId, companyActive, job, client, onSaved, onCancel, onStateChange }: Props) {
  const [baseline] = useState(() => jobDraft(job)); const [form, setForm] = useState(baseline); const [errors, setErrors] = useState<JobEditorErrors>({});
  const [message, setMessage] = useState(''); const [conflict, setConflict] = useState(false); const [busy, setBusy] = useState(false);
  const pending = useRef(false); const controller = useRef<AbortController | null>(null); const heading = useRef<HTMLHeadingElement>(null); const id = useId();
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { onStateChange(dirty, busy); }, [dirty, busy, onStateChange]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (!dirty && !busy) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, busy]);
  function update<K extends keyof JobDraft>(key: K, value: JobDraft[K]) { if (pending.current) return; setForm(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); if (!conflict) setMessage(''); }
  const field = (key: Exclude<keyof JobDraft, 'is_active' | 'salary_visible' | 'is_featured'>, hint?: string) => ({ id: id + '-' + key, name: key, value: form[key], disabled: busy, error: !!errors[key], helperText: errors[key] || hint, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value) });
  function cancel() { if (!dirty || window.confirm('تجاهل مسودة الوظيفة غير المحفوظة؟')) onCancel(); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending.current || conflict) return;
    const invalid = jobEditorErrors(form, job); setErrors(invalid); setMessage('');
    if (Object.keys(invalid).length) { requestAnimationFrame(() => document.getElementById(id + '-' + Object.keys(invalid)[0])?.focus()); return; }
    pending.current = true; setBusy(true); const request = new AbortController(); controller.current = request;
    try { await client.save(companyId, job, jobEditorPayload(form, companyId, job), request.signal); if (!request.signal.aborted) onSaved(); }
    catch (failure) { if (!request.signal.aborted) { setMessage(failure instanceof Error ? failure.message : 'تعذر حفظ الوظيفة. مسودتك ما زالت في النموذج.'); setConflict(!(failure instanceof JobManagementError) || failure.status === 409 || failure.status === 0 || failure.status >= 500); } }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  const selections = [{ key: 'field', label: 'المجال', options: FIELDS }, { key: 'job_type', label: 'نوع العمل', options: JOB_TYPES }, { key: 'experience_level', label: 'مستوى الخبرة', options: EXPERIENCE_LEVELS }, { key: 'region', label: 'المنطقة', options: REGIONS }] as const;
  return <Box component="form" noValidate aria-label={job ? 'تعديل الوظيفة' : 'نشر وظيفة جديدة'} aria-busy={busy} onSubmit={event => void submit(event)} sx={{ p: { xs: 2, md: 3 }, my: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <Typography component="h2" variant="h5" ref={heading} tabIndex={-1} mb={1}>{job ? 'تعديل الوظيفة' : 'نشر وظيفة جديدة'}</Typography>
    <Typography mb={3} color="text.secondary">العنوان والوصف مطلوبان. راجع إعدادات النشر والموعد قبل الحفظ.</Typography>
    {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
    <Box component="fieldset" disabled={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><legend className="sr-only">بيانات الوظيفة</legend>
      <Typography component="h3" variant="h6" mb={2}>البيانات الأساسية</Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
        <TextField label="عنوان الوظيفة" required inputProps={{ maxLength: 300 }} {...field('title')} />
        <TextField label="الموقع" inputProps={{ maxLength: 200 }} {...field('location', 'مدينة أو موقع العمل. اختياري.')} />
        {selections.map(item => <TextField key={item.key} label={item.label} select SelectProps={{ native: true }} {...field(item.key)}><option value="">غير محدد</option>{[...new Set([...item.options, ...(form[item.key] ? [form[item.key]] : [])])].map(value => <option key={value} value={value}>{value === 'remote' ? 'عن بُعد' : value}</option>)}</TextField>)}
      </Box>
      <TextField label="وصف الوظيفة" required multiline minRows={4} fullWidth sx={{ mt: 2 }} inputProps={{ maxLength: 30000 }} {...field('description')} />
      <Typography component="h3" variant="h6" mt={3} mb={2}>الراتب</Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
        <TextField label="الحد الأدنى للراتب" inputProps={{ inputMode: 'decimal', maxLength: 30 }} {...field('salary_min', 'اختياري، دون فواصل الآلاف.')} />
        <TextField label="الحد الأعلى للراتب" inputProps={{ inputMode: 'decimal', maxLength: 30 }} {...field('salary_max', 'اختياري، ولا يقل عن الحد الأدنى.')} />
        <TextField label="العملة" select SelectProps={{ native: true }} {...field('salary_currency')}>{CURRENCIES.map(value => <option key={value} value={value}>{value}</option>)}</TextField>
      </Box>
      <FormControlLabel control={<Checkbox id={id + '-salary_visible'} disabled={busy} checked={form.salary_visible} onChange={event => update('salary_visible', event.target.checked)} />} label="إظهار الراتب في صفحات الوظائف العامة" />
      {!form.salary_visible && <Typography variant="body2" color="text.secondary">يبقى الراتب متاحًا لإدارة الشركة، وتُحجب مبالغه عن القراءة العامة.</Typography>}
      <Typography component="h3" variant="h6" mt={3} mb={2}>الموعد والنشر</Typography>
      <TextField label="آخر يوم للتقديم" type="date" fullWidth InputLabelProps={{ shrink: true }} {...field('deadline', 'اختياري. تغيير اليوم يحدد نهايته ٢٣:٥٩ بتوقيت فلسطين (Asia/Hebron). تركه فارغًا يزيل الموعد.')} />
      {job?.deadline && form.deadline === baseline.deadline && <Typography variant="body2" color="text.secondary" mt={1}>الموعد المحفوظ: {new Intl.DateTimeFormat('ar', { timeZone: DEADLINE_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(job.deadline))}. يبقى كما هو ما لم تغيّر اليوم.</Typography>}
      <Box mt={1}><FormControlLabel control={<Checkbox id={id + '-is_active'} disabled={busy} checked={form.is_active} onChange={event => update('is_active', event.target.checked)} />} label="نشر الوظيفة للجمهور" /><FormControlLabel control={<Checkbox id={id + '-is_featured'} disabled={busy} checked={form.is_featured} onChange={event => update('is_featured', event.target.checked)} />} label="تمييز الوظيفة" /></Box>
      <Alert severity={form.is_active && companyActive ? 'info' : 'warning'} sx={{ my: 2 }}>{!companyActive ? 'الشركة موقوفة، ولن تظهر وظائفها للجمهور حتى تُفعّل.' : form.is_active ? 'ستظهر الوظيفة ضمن المنشورة. انتهاء الموعد يمنع التقديم ويخفيها من نتائج التقديم المفتوح.' : 'ستُحفظ الوظيفة موقوفة ولن تظهر في صفحات الوظائف العامة.'}</Alert>
      <TextField label="المتطلبات: كل متطلب في سطر" multiline minRows={2} fullWidth inputProps={{ maxLength: 50100 }} {...field('requirements', 'اختياري، حتى ١٠٠ سطر و٥٠٠ حرف لكل سطر.')} />
      <TextField label="المزايا: كل ميزة في سطر" multiline minRows={2} fullWidth sx={{ mt: 2 }} inputProps={{ maxLength: 50100 }} {...field('benefits', 'اختياري، حتى ١٠٠ سطر و٥٠٠ حرف لكل سطر.')} />
    </Box>
    <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mt={3}><Button type="submit" variant="contained" disabled={busy || conflict}>{busy ? 'جارٍ الحفظ…' : job ? 'حفظ التعديلات' : form.is_active ? 'نشر الوظيفة' : 'حفظ الوظيفة موقوفة'}</Button><Button type="button" onClick={cancel} disabled={busy}>إلغاء</Button><Typography variant="body2" color="text.secondary">{dirty ? 'لديك تغييرات غير محفوظة' : 'لم تُجرِ تغييرات بعد'}</Typography></Box>
  </Box>;
}
