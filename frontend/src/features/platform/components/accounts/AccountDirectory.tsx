import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useAuth } from '../../../../shared/AuthContext';
import { createAccountManagementClient, type AccountRecord, type AccountsResponse } from '../../api/accountManagement';
import { accountRoles, accountsQuery, patchAccountsSearch, readAccountsSearch } from '../../utils/accountManagement';
import AccountCard, { type AccountDesired } from './AccountCard';
export default function AccountDirectory({ scope }: { scope: 'all' | 'staff' }) { const { user } = useAuth(); return user ? <Directory key={user._id + ':' + user.role + ':' + scope} accountId={user._id} role={user.role} scope={scope} /> : null; }
function Directory({ accountId, role, scope }: { accountId: string; role: string; scope: 'all' | 'staff' }) {
  const [client] = useState(() => createAccountManagementClient(accountId, role)); const [params, setParams] = useSearchParams(); const filters = useMemo(() => readAccountsSearch(params, scope), [params, scope]); const query = accountsQuery(filters).toString();
  const [read, setRead] = useState<{ query: string; data: AccountsResponse | null; loading: boolean; error: string }>({ query: '', data: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0); const [notice, setNotice] = useState(''); const [writeError, setWriteError] = useState<{ id: string; message: string } | null>(null); const [pending, setPending] = useState(false); const pendingRef = useRef(false); const mutation = useRef<AbortController | null>(null);
  useEffect(() => () => mutation.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController(); setRead({ query, data: null, loading: true, error: '' });
    const timer = window.setTimeout(() => { void client.list(scope, new URLSearchParams(query), controller.signal).then(data => {
      if (controller.signal.aborted) return; setRead({ query, data, loading: false, error: '' });
      if (data.page !== filters.page) setParams(previous => accountsQuery(readAccountsSearch(previous, scope)).toString() === query ? patchAccountsSearch(previous, { page: data.page }) : previous, { replace: true });
    }).catch(failure => { if (!controller.signal.aborted) setRead({ query, data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل الحسابات.' }); }); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, scope, query, retry, filters.page, setParams]);
  const loading = read.query !== query || read.loading; const data = read.query === query ? read.data : null; const error = read.query === query ? read.error : ''; const blocked = pending || !!writeError;
  function reload() { if (pendingRef.current) return; setWriteError(null); setRead({ query, data: null, loading: true, error: '' }); setRetry(value => value + 1); }
  function change(patch: Record<string, string | number>) { if (blocked) return; setNotice(''); setParams(previous => patchAccountsSearch(previous, patch), { replace: 'q' in patch }); }
  async function save(user: AccountRecord, desired: AccountDesired) {
    if (pendingRef.current || writeError) throw new Error('أعد تحميل الحسابات قبل الحفظ.'); pendingRef.current = true; setPending(true); setNotice(''); const controller = new AbortController(); mutation.current = controller;
    try { await client.save(user, desired, controller.signal); if (!controller.signal.aborted) { setNotice('حُفظ تغيير الحساب وأُبطلت جلساته السابقة. تُحدّث النتائج حسب التصفية الحالية.'); setRead({ query, data: null, loading: true, error: '' }); setRetry(value => value + 1); } }
    catch (failure) { if (!controller.signal.aborted) setWriteError({ id: user._id, message: (failure instanceof Error ? failure.message : 'تعذر تأكيد الحفظ.') + ' اضغط «تحديث القائمة» لمراجعة الحالة المحفوظة.' }); throw failure; }
    finally { if (mutation.current === controller) mutation.current = null; pendingRef.current = false; if (!controller.signal.aborted) setPending(false); }
  }
  return <Box dir="rtl" m={{ xs: 2, md: 4 }} sx={{ fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root, & .MuiFormHelperText-root, & .MuiChip-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& .MuiTypography-body1, & .MuiButton-root': { fontSize: 14 }, '& .MuiTypography-body1': { lineHeight: 1.8 } }}>
    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between"><Typography component="h1" variant="h3" fontWeight={800}>{scope === 'staff' ? 'فريق الإدارة' : 'إدارة الحسابات'}</Typography><Box display="flex" flexWrap="wrap" gap={1}><Button color="inherit" variant="outlined" disabled={pending || loading} onClick={reload}>تحديث القائمة</Button><Button color="inherit" component={Link} to={scope === 'staff' ? '/admin/contacts' : '/admin/team'}>{scope === 'staff' ? 'كل الحسابات' : 'عرض فريق الإدارة'}</Button></Box></Box>
    <Typography color="text.secondary" mt={1} mb={3}>{scope === 'staff' ? 'حسابات المديرين فقط. حسابات الشركات والباحثين عن عمل متاحة من «كل الحسابات».' : 'ابحث في جميع الحسابات، وراجع حالتها وصلاحيتها قبل حفظ أي تغيير.'}</Typography>
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}{writeError && <Alert severity="warning" sx={{ mb: 2 }}>توقفت إجراءات الحفظ حتى تراجع أحدث البيانات.<Button color="inherit" disabled={pending || loading} onClick={reload}>تحديث القائمة</Button></Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: scope === 'staff' ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr 1fr' }, gap: 2 }}>
      <TextField label="ابحث عن حساب" placeholder="الاسم أو البريد أو الهاتف" value={filters.search} inputProps={{ maxLength: 120 }} disabled={blocked} onChange={event => change({ q: event.target.value })} />
      {scope === 'all' && <TextField select SelectProps={{ native: true }} label="الصلاحية" value={filters.role} disabled={blocked} onChange={event => change({ role: event.target.value })}><option value="all">كل الصلاحيات</option>{Object.entries(accountRoles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</TextField>}
      <TextField select SelectProps={{ native: true }} label="حالة الحساب" value={filters.state} disabled={blocked} onChange={event => change({ state: event.target.value })}><option value="all">كل الحالات</option><option value="active">مفعّل</option><option value="paused">موقوف</option></TextField>
      <TextField select SelectProps={{ native: true }} label="تأكيد البريد" value={filters.verification} disabled={blocked} onChange={event => change({ verification: event.target.value })}><option value="all">كل الحسابات</option><option value="verified">مؤكّد</option><option value="unverified">غير مؤكّد</option></TextField>
      <TextField select SelectProps={{ native: true }} label="الترتيب" value={filters.sort} disabled={blocked} onChange={event => change({ sort: event.target.value })}><option value="newest">الأحدث</option><option value="oldest">الأقدم</option><option value="name">الاسم</option></TextField>
    </Box><Typography role="status" color="text.secondary" my={2}>{loading ? 'جارٍ تحميل الحسابات…' : !error && data ? `${data.total} نتيجة من أصل ${data.counts.all} حساب · ${data.counts.active} مفعّل، ${data.counts.paused} موقوف` : ''}</Typography>
    {error && <Alert severity="error">{error}<Button color="inherit" onClick={reload}>إعادة المحاولة</Button></Alert>}
    {!loading && !error && data && (!data.users.length ? <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5">لا توجد حسابات مطابقة</Typography><Typography color="text.secondary" my={1}>غيّر البحث أو الحالة أو الصلاحية أو تأكيد البريد.</Typography><Button color="inherit" disabled={blocked} onClick={() => change({ q: '', state: 'all', role: 'all', verification: 'all' })}>مسح البحث والتصفية</Button></Box> : <><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>{data.users.map(user => <AccountCard key={user._id + ':' + user.revision + ':' + retry} user={user} disabled={blocked} error={writeError?.id === user._id ? writeError.message : ''} onSave={desired => save(user, desired)} />)}</Box>{data.pages > 1 && <Box component="nav" aria-label="صفحات الحسابات" display="flex" justifyContent="center" flexWrap="wrap" alignItems="center" gap={2} mt={3}><Button color="inherit" disabled={blocked || data.page <= 1} onClick={() => change({ page: data.page - 1 })}>السابق</Button><Typography>الصفحة {data.page} من {data.pages}</Typography><Button color="inherit" disabled={blocked || data.page >= data.pages} onClick={() => change({ page: data.page + 1 })}>التالي</Button></Box>}</>)}
  </Box>;
}
