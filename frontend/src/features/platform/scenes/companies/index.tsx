import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../shared/AuthContext';
import { createCompanyManagementClient, type CompaniesResult, type CompanyManagementClient, type ManagedCompany } from '../../api/companyManagement';
import { companiesQuery, patchCompaniesSearch, readCompaniesSearch } from '../../utils/companyManagement';
import { adminCompanyLinks } from '../../utils/adminDashboard';
import CompanyEditor from '../../components/company/CompanyEditor';
import CompanyAccountForm from '../../components/company/CompanyAccountForm';
import HistoryButton from '../../components/management/HistoryButton';
type Panel = { kind: 'new' } | { kind: 'edit' | 'account'; id: string };
export default function Companies() { const { user } = useAuth(); return user ? <CompanyAdministration key={user._id + ':' + user.role} accountId={user._id} role={user.role} /> : null; }
function CompanyAdministration({ accountId, role }: { accountId: string; role: string }) {
  const [client] = useState(() => createCompanyManagementClient(accountId, role)); const [params, setParams] = useSearchParams(); const filters = useMemo(() => readCompaniesSearch(params), [params]); const query = companiesQuery(filters).toString();
  const [read, setRead] = useState<{ query: string; data: CompaniesResult | null; loading: boolean; error: string }>({ query: '', data: null, loading: true, error: '' });
  const [retry, setRetry] = useState(0); const [panel, setPanel] = useState<Panel | null>(null); const [notice, setNotice] = useState(''); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setRead({ query, data: null, loading: true, error: '' });
    const timer = window.setTimeout(() => { void client.list(new URLSearchParams(query), controller.signal).then(data => {
      if (controller.signal.aborted) return; setRead({ query, data, loading: false, error: '' });
      if (data.page !== Number(new URLSearchParams(query).get('page'))) setParams(previous => companiesQuery(readCompaniesSearch(previous)).toString() === query ? patchCompaniesSearch(previous, { page: data.page }) : previous, { replace: true });
    }).catch(failure => { if (!controller.signal.aborted) setRead({ query, data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل الشركات.' }); }); }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [client, query, retry, setParams]);
  const loading = read.query !== query || read.loading; const data = read.query === query ? read.data : null; const error = read.query === query ? read.error : '';
  function reload() { setRead({ query, data: null, loading: true, error: '' }); setRetry(value => value + 1); }
  function change(patch: Record<string, string | number>) { if (panel) return; setNotice(''); setParams(previous => patchCompaniesSearch(previous, patch), { replace: 'q' in patch }); }
  function close() { setPanel(null); requestAnimationFrame(() => heading.current?.focus()); }
  function saved(kind: Panel['kind']) { close(); setNotice(kind === 'account' ? 'تم إنشاء الحساب وربطه بالشركة.' : kind === 'new' ? 'تمت إضافة الشركة. اعرض الأحدث إذا لم تظهر ضمن تصفيتك الحالية.' : 'تم حفظ التعديل. قد تتغير نتائج التصفية بحسب حالة الشركة الجديدة.'); reload(); }
  return <Box m={{ xs: 2, md: 4 }} dir="rtl" sx={{ fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root, & .MuiFormControlLabel-label, & .MuiFormHelperText-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& .MuiTypography-body1, & .MuiButton-root': { fontSize: 14 }, '& .MuiTypography-body1': { lineHeight: 1.8 }, '& .MuiFormHelperText-root': { fontSize: 13, lineHeight: 1.7 } }}>
    <Box display="flex" gap={2} alignItems="center" justifyContent="space-between" flexWrap="wrap"><Typography component="h1" variant="h3" fontWeight={800} tabIndex={-1} ref={heading}>إدارة الشركات</Typography><Box display="flex" gap={1} flexWrap="wrap"><Button color="secondary" variant="contained" disabled={!!panel || loading || !!error} onClick={() => { setNotice(''); setPanel({ kind: 'new' }); }}>إضافة شركة</Button><Button color="inherit" variant="outlined" disabled={!!panel || loading} onClick={reload}>تحديث القائمة</Button></Box></Box>
    <Typography color="text.secondary" mt={1} mb={3}>راجع بيانات الشركات وحالتها وحساب إدارتها. الشركات الموقوفة تبقى محفوظة للمراجعة.</Typography>
    {notice && <Alert severity="success" sx={{ my: 2 }}>{notice}</Alert>}
    {panel ? panel.kind === 'new' ? <CompanyEditor key="new" client={client} onCancel={close} onSaved={() => saved('new')} /> : <CompanyPanel key={panel.kind + ':' + panel.id} panel={panel} client={client} onCancel={close} onSaved={() => saved(panel.kind)} /> : <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '2fr 1fr 1fr 1fr' }, gap: 2 }}>
        <TextField label="ابحث عن شركة" placeholder="الاسم أو المدينة أو القطاع" value={filters.search} inputProps={{ maxLength: 120 }} onChange={event => change({ q: event.target.value })} />
        <TextField select SelectProps={{ native: true }} label="حالة الشركة" value={filters.state} onChange={event => change({ state: event.target.value })}><option value="all">كل الحالات</option><option value="active">مفعّلة</option><option value="paused">موقوفة</option></TextField>
        <TextField select SelectProps={{ native: true }} label="التوثيق" value={filters.verification} onChange={event => change({ verification: event.target.value })}><option value="all">كل الشركات</option><option value="verified">موثّقة</option><option value="unverified">غير موثّقة</option></TextField>
        <TextField select SelectProps={{ native: true }} label="الترتيب" value={filters.sort} onChange={event => change({ sort: event.target.value })}><option value="name">الاسم</option><option value="newest">الأحدث إضافة</option></TextField>
      </Box>
      <Typography role="status" my={2} color="text.secondary">{loading ? 'جارٍ تحميل الشركات…' : !error && data ? `${data.total} نتيجة من أصل ${data.counts.all} شركة · ${data.counts.active} مفعّلة، ${data.counts.paused} موقوفة` : ''}</Typography>
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}<Button color="inherit" disabled={loading} onClick={reload}>إعادة المحاولة</Button></Alert>}
      {!loading && !error && data && (!data.companies.length ? <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h2" variant="h5" mb={1}>{data.counts.all ? 'لا توجد شركات مطابقة' : 'لم تُضف شركات بعد'}</Typography><Typography color="text.secondary">{data.counts.all ? 'غيّر البحث أو الحالة أو التوثيق.' : 'اضغط «إضافة شركة» لإنشاء أول صفحة شركة.'}</Typography>{data.counts.all > 0 && <Button color="inherit" onClick={() => change({ q: '', state: 'all', verification: 'all' })}>مسح البحث والتصفية</Button>}</Box> : <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>{data.companies.map(company => <CompanyCard key={company._id} company={company} onEdit={() => { setNotice(''); setPanel({ kind: 'edit', id: company._id }); }} onAccount={() => { setNotice(''); setPanel({ kind: 'account', id: company._id }); }} />)}</Box>
        {data.pages > 1 && <Box component="nav" aria-label="صفحات الشركات" display="flex" justifyContent="center" flexWrap="wrap" alignItems="center" gap={2} mt={3}><Button color="inherit" disabled={data.page <= 1} onClick={() => change({ page: data.page - 1 })}>السابق</Button><Typography>الصفحة {data.page} من {data.pages}</Typography><Button color="inherit" disabled={data.page >= data.pages} onClick={() => change({ page: data.page + 1 })}>التالي</Button></Box>}
      </>)}
    </>}
  </Box>;
}
function CompanyCard({ company, onEdit, onAccount }: { company: ManagedCompany; onEdit: () => void; onAccount: () => void }) {
  const links = adminCompanyLinks(company._id);
  return <Box component="article" sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere' }}><Typography component="h2" variant="h5" fontWeight={700} mb={1}>{company.name_ar}</Typography><Box display="flex" gap={1} flexWrap="wrap"><Chip size="small" label={company.is_active ? 'مفعّلة' : 'موقوفة'} color={company.is_active ? 'success' : 'warning'} variant="outlined" /><Chip size="small" label={company.is_verified ? 'موثّقة' : 'غير موثّقة'} variant="outlined" /></Box><Typography color="text.secondary" mt={1.5}>{company.location || 'الموقع غير محدد'} · {company.sector || 'القطاع غير محدد'}</Typography><Typography my={1.5}>{company.user_id ? 'حساب إدارة مرتبط' : 'لا يوجد حساب إدارة مرتبط'}</Typography>
    <Box display="flex" flexWrap="wrap" gap={1}><Button color="inherit" variant="outlined" aria-label={'تعديل ' + company.name_ar} onClick={onEdit}>تعديل البيانات والحالة</Button><Button color="inherit" component={Link} to={links.dashboard}>لوحة الشركة</Button>{company.is_active && <Button color="inherit" component={Link} to={'/company/' + encodeURIComponent(company._id)}>الصفحة العامة</Button>}{!company.user_id && company.is_active && <Button color="inherit" onClick={onAccount}>إنشاء حساب الإدارة</Button>}</Box>
    <HistoryButton kind="company" targetId={company._id} label={company.name_ar} />
  </Box>;
}
function CompanyPanel({ panel, client, onCancel, onSaved }: { panel: { kind: 'edit' | 'account'; id: string }; client: CompanyManagementClient; onCancel: () => void; onSaved: () => void }) {
  const [read, setRead] = useState<{ company: ManagedCompany | null; error: string }>({ company: null, error: '' }); const [retry, setRetry] = useState(0);
  useEffect(() => { const controller = new AbortController(); setRead({ company: null, error: '' }); void client.detail(panel.id, controller.signal).then(company => { if (!controller.signal.aborted) setRead({ company, error: '' }); }).catch(failure => { if (!controller.signal.aborted) setRead({ company: null, error: failure instanceof Error ? failure.message : 'تعذر تحميل الشركة.' }); }); return () => controller.abort(); }, [client, panel.id, retry]);
  if (!read.company) return <Box my={3}>{read.error ? <Alert severity="error">{read.error}<Button color="inherit" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</Button></Alert> : <Typography role="status">جارٍ تحميل أحدث بيانات الشركة…</Typography>}<Button color="inherit" onClick={onCancel}>العودة للقائمة</Button></Box>;
  if (panel.kind === 'account' && (read.company.user_id || !read.company.is_active)) return <Box my={3}><Alert severity="warning">الشركة مرتبطة بحساب بالفعل أو موقوفة. راجع بياناتها قبل إنشاء حساب.</Alert><Button color="inherit" onClick={onCancel}>العودة للقائمة</Button></Box>;
  return panel.kind === 'edit' ? <CompanyEditor key={read.company._id + ':' + read.company.__v} original={read.company} client={client} onSaved={onSaved} onCancel={onCancel} /> : <CompanyAccountForm company={read.company} client={client} onSaved={onSaved} onCancel={onCancel} />;
}
