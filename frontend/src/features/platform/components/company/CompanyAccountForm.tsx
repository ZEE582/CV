import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { CompanyManagementError, type CompanyManagementClient, type ManagedCompany } from '../../api/companyManagement';
export default function CompanyAccountForm({ company, client, onSaved, onCancel }: { company: ManagedCompany; client: CompanyManagementClient; onSaved: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [blocked, setBlocked] = useState(false);
  const pending = useRef(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending.current || blocked) return; const values = new FormData(event.currentTarget as HTMLFormElement); const actual = { email: String(values.get('email') || ''), password: String(values.get('password') || ''), full_name: String(values.get('full_name') || '') }; pending.current = true; setBusy(true); setError(''); const request = new AbortController(); controller.current = request;
    try { await client.createAccount(company, actual, request.signal); if (!request.signal.aborted) { setPassword(''); onSaved(); } }
    catch (failure) { if (!request.signal.aborted) { setError(failure instanceof Error ? failure.message : 'تعذر تأكيد إنشاء الحساب.'); setBlocked(failure instanceof CompanyManagementError && (failure.uncertain || failure.status === 409)); } }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  return <Box component="form" onSubmit={event => void submit(event)} dir="rtl" aria-busy={busy} sx={{ my: 3, p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5" fontWeight={700} mb={2}>إنشاء حساب لإدارة {company.name_ar}</Typography><Typography mb={2}>يستخدم المسؤول البريد وكلمة المرور للدخول، ثم رمز التحقق الذي يصله بالبريد. لا يغيّر هذا الإجراء جلسة المدير الحالية.</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}{blocked && ' أعد تحميل الشركة قبل محاولة إنشاء حساب آخر.'}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}><TextField name="full_name" label="اسم مسؤول الشركة" value={name} onChange={event => setName(event.target.value)} inputProps={{ maxLength: 200 }} autoComplete="off" disabled={busy} /><TextField name="email" label="بريد حساب الشركة" type="email" required value={email} onChange={event => setEmail(event.target.value)} inputProps={{ maxLength: 254 }} autoComplete="off" disabled={busy} /><TextField name="password" label="كلمة مرور الحساب الجديد" type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" inputProps={{ minLength: 8, maxLength: 128 }} disabled={busy} helperText="8 أحرف على الأقل. شاركها مع المسؤول بطريقة آمنة." /></Box>
    <Box display="flex" flexWrap="wrap" gap={2} mt={2}><Button type="submit" color="secondary" variant="contained" disabled={busy || blocked}>{busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء وربط الحساب'}</Button><Button color="inherit" onClick={onCancel} disabled={busy}>إلغاء</Button></Box>
  </Box>;
}
