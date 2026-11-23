import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../shared/AuthContext';
import { createAdminDashboardClient, type AdminDashboardData, type AdminStats } from '../../api/adminDashboard';
import { adminCompanyLinks, selectedAdminCompany } from '../../utils/adminDashboard';
import { publicationState } from '../../utils/jobEditorValidation';
import { messageDate } from '../../utils/messages';
export default function Dashboard() { const { user } = useAuth(); return user ? <AdminOverview key={user._id + ':' + user.role} accountId={user._id} role={user.role} /> : null; }
function AdminOverview({ accountId, role }: { accountId: string; role: string }) {
  const [client] = useState(() => createAdminDashboardClient(accountId, role)); const [attempt, setAttempt] = useState(0);
  const [read, setRead] = useState<{ data: AdminDashboardData | null; loading: boolean; error: string }>({ data: null, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController(); setRead({ data: null, loading: true, error: '' });
    void client.load(controller.signal).then(data => { if (!controller.signal.aborted) setRead({ data, loading: false, error: '' }); }).catch(failure => { if (!controller.signal.aborted) setRead({ data: null, loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل لوحة الإدارة.' }); });
    return () => controller.abort();
  }, [client, attempt]);
  function refresh() { if (read.loading) return; setRead({ data: null, loading: true, error: '' }); setAttempt(value => value + 1); }
  return <Box m={{ xs: 2, md: 4 }} dir="rtl" sx={{ fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& .MuiTypography-body1, & .MuiButton-root': { fontSize: 14 }, '& .MuiTypography-body1': { lineHeight: 1.8 } }}>
    <Box display="flex" justifyContent="space-between" gap={2} alignItems="center" flexWrap="wrap"><Typography component="h1" variant="h3" fontWeight={800}>لوحة الإدارة</Typography><Button color="inherit" variant="outlined" disabled={read.loading} onClick={refresh}>تحديث البيانات</Button></Box>
    <Typography mt={1} mb={2} color="text.secondary">نظرة عامة على المنصة. اختر شركة لمتابعة وظائفها وطلباتها ورسائلها.</Typography>
    {read.loading ? <Typography role="status" my={3}>جارٍ تحميل بيانات الإدارة…</Typography> : read.error ? <Alert severity="error" sx={{ my: 3 }}>{read.error}<Button color="inherit" onClick={refresh}>إعادة المحاولة</Button></Alert> : read.data && <DashboardContents data={read.data} />}
  </Box>;
}
export function DashboardContents({ data }: { data: AdminDashboardData }) {
  const [params, setParams] = useSearchParams(); const company = selectedAdminCompany(data.companies, params.get('company')); const issues = data.recordIssues; const s = data.stats;
  const cards: { key: keyof AdminStats; label: string; hint: string; to?: string }[] = [
    { key: 'totalUsers', label: 'الحسابات', hint: `${s.activeUsers} حساب مفعّل`, to: '/admin/contacts' },
    { key: 'totalCompanies', label: 'الشركات', hint: `${s.activeCompanies} مفعّلة · ${s.verifiedCompanies} موثّقة`, to: '/admin/companies' },
    { key: 'totalJobs', label: 'كل الوظائف', hint: 'تشمل الموقوفة والمنتهية' },
    { key: 'openJobs', label: 'وظائف مفتوحة للتقديم', hint: 'لشركات مفعّلة وضمن الموعد' },
    { key: 'reviewableApplications', label: 'طلبات قابلة للمراجعة', hint: `${s.totalApplications} طلب محفوظ إجمالًا` },
    { key: 'reviewablePendingApplications', label: 'طلبات قيد الانتظار', hint: 'ضمن الطلبات القابلة للمراجعة' },
    { key: 'reviewableMessages', label: 'رسائل الشركات', hint: `${s.totalMessages} رسالة محفوظة إجمالًا` },
    { key: 'unreadMessages', label: 'رسائل غير مقروءة', hint: 'ضمن رسائل الشركات الموجودة' },
  ];
  const links = company ? adminCompanyLinks(company._id) : null;
  return <>
    <Typography color="text.secondary" mb={2}>آخر تحميل بتوقيت فلسطين: {messageDate(data.generated_at)}. تتحدث الأرقام عند إعادة تحميل اللوحة.</Typography>
    {(issues.jobs + issues.applications + issues.messages > 0) && <Alert severity="warning" sx={{ mb: 3 }}>بيانات تحتاج مراجعة الارتباط بالشركات والوظائف: {issues.jobs} وظيفة، {issues.applications} طلب، {issues.messages} رسالة. تدخل ضمن الإجماليات المحفوظة، وتُستبعد من الأعداد القابلة للمتابعة.</Alert>}
    <Box component="section" aria-label="إحصائيات المنصة" sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 2 }}>{cards.map(card => <Box key={card.key} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere' }}><Typography fontWeight={700}>{card.label}</Typography><Typography component="p" variant="h4" sx={{ fontSize: 30, fontWeight: 800, my: 1 }}>{s[card.key].toLocaleString('ar')}</Typography><Typography color="text.secondary">{card.hint}</Typography>{card.to && <Button color="inherit" component={Link} to={card.to} sx={{ mt: 1 }}>إدارة {card.label}</Button>}</Box>)}</Box>
    <Box component="section" aria-label="متابعة شركة" my={4}><Typography component="h2" variant="h5" fontWeight={700} mb={1}>متابعة شركة</Typography><Typography color="text.secondary" mb={2}>اختر الشركة التي تريد العمل عليها. يشمل الاختيار الشركات الموقوفة لمراجعة بياناتها.</Typography>
      {data.companies.length ? <TextField select SelectProps={{ native: true }} fullWidth label="الشركة المراد متابعتها" value={company?._id || ''} onChange={event => setParams(event.target.value ? { company: event.target.value } : {})}><option value="">اختر شركة</option>{data.companies.map(item => <option key={item._id} value={item._id}>{item.name_ar || item.name_en}{item.is_active ? '' : ' (موقوفة)'}</option>)}</TextField> : <Typography>لم تُضف شركات بعد. ابدأ من إدارة الشركات.</Typography>}
      {params.has('company') && !company && <Alert severity="warning" sx={{ mt: 2 }}>الشركة المحددة في الرابط غير متاحة. اختر شركة من القائمة.</Alert>}
      {company && links && <Box display="flex" gap={1.5} flexWrap="wrap" mt={2}><Button color="secondary" variant="contained" component={Link} to={links.dashboard}>لوحة الشركة</Button><Button color="inherit" variant="outlined" component={Link} to={links.applicants}>اختيار وظيفة لمراجعة المتقدمين</Button><Button color="inherit" variant="outlined" component={Link} to={links.messages}>كل رسائل الشركة</Button><Button color="inherit" variant="outlined" component={Link} to={links.unread}>الرسائل غير المقروءة</Button></Box>}
    </Box>
    <Box component="section" aria-label="أحدث الوظائف" my={4}><Typography component="h2" variant="h5" fontWeight={700} mb={1}>أحدث الوظائف</Typography><Typography color="text.secondary" mb={2}>آخر خمس وظائف مرتبطة بشركات موجودة، بما فيها الموقوفة والمنتهية.</Typography>
      {!data.recentJobs.length ? <Typography>لا توجد وظائف مرتبطة بشركات لعرضها حاليًا.</Typography> : <Box display="grid" gap={2}>{data.recentJobs.map(job => { const state = publicationState(job, job.company_active); const paths = adminCompanyLinks(job.company_id, job._id); return <Box component="article" key={job._id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere' }}><Box display="flex" gap={1} flexWrap="wrap" alignItems="center"><Typography component="h3" variant="h5" fontWeight={700}>{job.title}</Typography><Chip size="small" label={state.label} color={state.tone} /></Box><Typography mt={1}>{job.company_name}</Typography><Typography color="text.secondary" my={1}>{messageDate(job.createdAt || '')}</Typography><Box display="flex" flexWrap="wrap" gap={1}><Button color="inherit" component={Link} to={paths.dashboard}>إدارة الشركة</Button><Button color="inherit" component={Link} to={paths.applicants}>متقدمو هذه الوظيفة</Button></Box></Box>; })}</Box>}
    </Box>
  </>;
}
