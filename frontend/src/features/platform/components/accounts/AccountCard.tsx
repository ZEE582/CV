import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import type { AccountRecord, AccountRole } from '../../api/accountManagement';
import { accountChangeError, accountProtection, accountRoles } from '../../utils/accountManagement';
import { adminCompanyLinks } from '../../utils/adminDashboard';
import { messageDate } from '../../utils/messages';
import HistoryButton from '../management/HistoryButton';
export type AccountDesired = { role: AccountRole; is_active: boolean };
export default function AccountCard({ user, disabled = false, error = '', onSave }: { user: AccountRecord; disabled?: boolean; error?: string; onSave: (desired: AccountDesired) => Promise<void> }) {
  const [draft, setDraft] = useState<AccountDesired>({ role: user.role, is_active: user.is_active });
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false);
  const changed = draft.role !== user.role || draft.is_active !== user.is_active;
  const validation = accountChangeError(user, draft); const protectedAccount = !user.capabilities.can_change_status && user.capabilities.allowed_roles.length === 1;
  async function confirm() { if (busy || disabled || error || validation || !changed) return; setBusy(true); try { await onSave(draft); setReview(false); } catch { /* Parent retains the draft and requires a reload before retrying. */ } finally { setBusy(false); } }
  const summary = <><Typography sx={{ overflowWrap: 'anywhere' }} fontWeight={700}>{user.name || 'اسم غير مضاف'}</Typography><Typography dir="ltr" sx={{ textAlign: 'start', overflowWrap: 'anywhere' }}>{user.email}</Typography></>;
  return <Box component="article" aria-label={'حساب ' + user.email} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere' }}>
    {summary}<Box display="flex" flexWrap="wrap" gap={1} my={1.5}><Chip size="small" label={accountRoles[user.role]} variant="outlined" /><Chip size="small" color={user.is_active ? 'success' : 'warning'} label={user.is_active ? 'مفعّل' : 'موقوف'} variant="outlined" /><Chip size="small" label={user.is_verified ? 'البريد مؤكّد' : 'البريد غير مؤكّد'} variant="outlined" /></Box>
    <Typography color="text.secondary">{user.phone ? <>الهاتف: <bdi>{user.phone}</bdi> · </> : null}الدخول: {({ local: 'البريد وكلمة المرور', google: 'Google', github: 'GitHub', linkedin: 'LinkedIn' } as Record<string, string>)[user.provider] || 'مزود خارجي'}</Typography>
    <Typography color="text.secondary" mb={1.5}>أُنشئ: {user.createdAt ? messageDate(user.createdAt) : 'غير محدد'}</Typography>
    {user.companies.map(company => <Button key={company._id} component={Link} color="inherit" to={adminCompanyLinks(company._id).dashboard}>شركة {company.name_ar}{!company.is_active ? ' · موقوفة' : ''}</Button>)}
    {user.capabilities.reason && <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>{accountProtection(user.capabilities.reason)}</Typography>}
    {!protectedAccount && <><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))' }, gap: 2, mt: 2 }}>
      <TextField select SelectProps={{ native: true }} label="الصلاحية المطلوبة" disabled={disabled || busy || !!error || user.capabilities.allowed_roles.length === 1} value={draft.role} onChange={event => setDraft(previous => ({ ...previous, role: event.target.value as AccountRole }))}>{user.capabilities.allowed_roles.map(role => <option key={role} value={role}>{accountRoles[role]}</option>)}</TextField>
      <TextField select SelectProps={{ native: true }} label="الحالة المطلوبة" disabled={disabled || busy || !!error || !user.capabilities.can_change_status} value={String(draft.is_active)} onChange={event => setDraft(previous => ({ ...previous, is_active: event.target.value === 'true' }))}><option value="true">مفعّل</option><option value="false">موقوف</option></TextField>
    </Box><Typography color="text.secondary" sx={{ fontSize: 13, my: 1 }}>اختيار القيم لا يحفظ التغيير. راجعه ثم أكّد الحفظ.</Typography>
    {validation && <Alert severity="warning">{validation}</Alert>}
    <Box display="flex" flexWrap="wrap" gap={1} mt={1}><Button color="secondary" variant="contained" disabled={!changed || !!validation || disabled || busy || !!error} onClick={() => setReview(true)}>مراجعة التغيير</Button><Button color="inherit" disabled={!changed || disabled || busy || !!error} onClick={() => setDraft({ role: user.role, is_active: user.is_active })}>إلغاء التعديلات</Button></Box></>}
    <HistoryButton kind="account" targetId={user._id} label={user.name || user.email} disabled={disabled || busy} />
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Dialog open={review} onClose={() => { if (!busy) setReview(false); }} fullWidth maxWidth="sm" aria-labelledby={'review-' + user._id} PaperProps={{ dir: 'rtl', sx: { m: 2, width: 'calc(100% - 32px)', fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiButton-root': { fontFamily: 'inherit', overflowWrap: 'anywhere' }, '& .MuiTypography-body1, & .MuiButton-root, & .MuiAlert-message, & dt, & dd': { fontSize: 14, lineHeight: 1.8 }, '& .MuiDialogTitle-root': { fontSize: 20 } } }}>
      <DialogTitle id={'review-' + user._id}>مراجعة تغيير الحساب</DialogTitle><DialogContent>{summary}<Box component="dl" sx={{ my: 2, '& dt': { color: 'text.secondary' }, '& dd': { m: 0, mb: 1 } }}><dt>الصلاحية</dt><dd>{accountRoles[user.role]} ← {accountRoles[draft.role]}</dd><dt>الحالة</dt><dd>{user.is_active ? 'مفعّل' : 'موقوف'} ← {draft.is_active ? 'مفعّل' : 'موقوف'}</dd></Box>
      <Alert severity={draft.role === 'admin' ? 'warning' : 'info'}>{draft.role === 'admin' ? 'سيحصل هذا الحساب على صلاحيات إدارة المنصة كاملة، بما فيها الحسابات والشركات والوظائف والطلبات والرسائل. ' : ''}سيُنهي الحفظ جميع جلسات الدخول السابقة لهذا الحساب. {draft.is_active ? 'سيحتاج تسجيل الدخول مجددًا.' : 'لن يستطيع تسجيل الدخول ما دام موقوفًا.'}</Alert>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}><Button color="inherit" disabled={busy} onClick={() => setReview(false)}>رجوع دون حفظ</Button><Button color="secondary" variant="contained" disabled={busy || disabled || !!error || !!validation || !changed} onClick={() => void confirm()}>{busy ? 'جارٍ الحفظ…' : 'تأكيد وحفظ التغيير'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
