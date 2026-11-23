import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { useAuth } from '../../../../shared/AuthContext';
import { JobManagementError } from '../../api/jobManagement';
import useCompanyWorkspace from '../../hooks/useCompanyWorkspace';
import CompanyPicker from '../../components/company/CompanyPicker';
import CompanyOverview from '../../components/company/CompanyOverview';
import { companyJobPage, patchCompanyDashboardSearch, publicationViews, readCompanyDashboardSearch } from '../../utils/companyDashboard';
import JobEditor from '../../components/jobs/JobEditor';
import { publicationState, deadlineDay } from '../../utils/jobEditorValidation';
import { fmtSal } from '../../utils/helpers';
import type { Job } from '../../types';
export default function CompanyDashboard() { const { user } = useAuth(); const [params] = useSearchParams(); return <DashboardContent key={(user?._id || '') + ':' + user?.role + ':' + (params.get('company') ?? 'default')} />; }
function DashboardContent() {
  const workspace = useCompanyWorkspace(); const [params, setParams] = useSearchParams(); const filters = readCompanyDashboardSearch(params); const [editing, setEditing] = useState<Job | 'new' | null>(null);
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [needsReview, setNeedsReview] = useState(false);
  const [editorState, setEditorState] = useState({ dirty: false, busy: false }); const pending = useRef(false); const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null); const companyId = workspace.company?._id; const companyActive = workspace.company?.is_active === true;
  const receiveEditorState = useCallback((dirty: boolean, saving: boolean) => setEditorState({ dirty, busy: saving }), []);
  useEffect(() => () => controller.current?.abort(), []);
  const locked = busy || editing !== null;
  function closeEditor() { setEditing(null); setEditorState({ dirty: false, busy: false }); requestAnimationFrame(() => heading.current?.focus()); }
  function refresh() { if (locked) return; setNeedsReview(false); setError(''); workspace.refresh(); }
  async function setState(job: Job) {
    if (pending.current || editing || needsReview) return; pending.current = true; setBusy(true); setError(''); setMessage('');
    const request = new AbortController(); controller.current = request; const desired = !job.is_active;
    try { await workspace.client.setState(job, desired, request.signal); if (!request.signal.aborted) { setMessage(desired ? 'تم تفعيل الوظيفة. استمرار ظهورها في التقديم المفتوح يعتمد على موعدها وحالة الشركة.' : 'تم إيقاف الوظيفة وإخفاؤها من صفحات الوظائف العامة.'); workspace.refresh(); } }
    catch (failure) { if (!request.signal.aborted) { setError(failure instanceof Error ? failure.message : 'تعذر تغيير الحالة. أعد تحميل القائمة للتحقق.'); setNeedsReview(!(failure instanceof JobManagementError) || failure.status === 0 || failure.status === 409 || failure.status >= 500); } }
    finally { if (!request.signal.aborted) { pending.current = false; setBusy(false); } }
  }
  const results = companyJobPage(workspace.jobs, filters, companyActive);
  useEffect(() => {
    if (!workspace.loading && !workspace.error && companyId && results.page !== filters.page) setParams(previous => patchCompanyDashboardSearch(previous, { page: results.page }), { replace: true });
  }, [companyId, workspace.loading, workspace.error, results.page, filters.page, setParams]);
  const change = (patch: Record<string, string | number>) => { if (!locked) setParams(previous => patchCompanyDashboardSearch(previous, patch), { replace: 'q' in patch }); };
  return <Box m={{ xs: 2, md: 4 }} dir="rtl" sx={{ fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiButton-root': { fontFamily: 'inherit' }, '& .MuiInputBase-root': { fontSize: 16 }, '& .MuiTypography-body1, & .MuiButton-root': { fontSize: 14 }, '& .MuiTypography-body1': { lineHeight: 1.8 } }}><Typography component="h1" variant="h3" fontWeight="bold" ref={heading} tabIndex={-1}>لوحة الشركة والوظائف</Typography><Typography color="text.secondary" mt={1}>انشر الوظائف وراجع حالتها ومواعيدها، ثم تابع الطلبات والرسائل من الشركة نفسها.</Typography>
    <CompanyPicker companies={workspace.companies} selected={workspace.company} onSelect={id => { if (locked) return; setParams(previous => patchCompanyDashboardSearch(previous, { company: id })); setMessage(''); setError(''); setNeedsReview(false); }} isAdmin={workspace.isAdmin} disabled={locked || workspace.loading} />
    {workspace.loading && <Typography role="status">جارٍ تحميل بيانات الشركة والوظائف…</Typography>}
    {(workspace.error || error) && <Alert severity="error" sx={{ my: 2 }}>{workspace.error || error}<Button color="inherit" disabled={locked} onClick={refresh}>إعادة تحميل القائمة</Button></Alert>}
    {message && <Alert severity="success" sx={{ my: 2 }}>{message}</Alert>}
    {!workspace.loading && !workspace.error && !companyId && <Box my={3}><Typography mb={2}>لا توجد شركة مرتبطة أو متاحة لهذا الحساب.</Typography>{workspace.isAdmin && <Button color="inherit" component={Link} to="/admin/companies">إدارة الشركات وربط الحسابات</Button>}</Box>}
    {companyId && !workspace.loading && !workspace.error && <>
      {!companyActive && <Alert severity="warning" sx={{ my: 2 }}>الشركة موقوفة. يمكنك مراجعة بيانات الوظائف، وستبقى غير ظاهرة للجمهور حتى تفعيل الشركة.</Alert>}
      <Box display="flex" flexWrap="wrap" gap={2} my={3}><Button color="secondary" variant="contained" disabled={locked || needsReview} onClick={() => { setEditing('new'); setMessage(''); setError(''); }}>نشر وظيفة</Button><Button color="inherit" component={Link} disabled={locked} to={`/admin/applicants?company=${companyId}`}>عرض المتقدمين</Button><Button color="inherit" component={Link} disabled={locked} to={`/admin/messages?company=${companyId}`}>رسائل الشركة</Button>{companyActive && <Button color="inherit" component={Link} disabled={locked} to={`/company/${companyId}`}>عرض صفحة الشركة</Button>}<Button color="inherit" disabled={locked} onClick={refresh}>تحديث اللوحة</Button></Box>
      {!editing && <CompanyOverview key={companyId} companyId={companyId} client={workspace.client} disabled={locked} onView={view => change({ view, q: '' })} />}
      {editing && <JobEditor key={editing === 'new' ? `${companyId}-new` : editing._id} companyId={companyId} companyActive={companyActive} client={workspace.client} job={editing === 'new' ? undefined : editing} onStateChange={receiveEditorState} onCancel={closeEditor} onSaved={() => { closeEditor(); setMessage('تم حفظ الوظيفة. تُحمّل القائمة لعرض حالتها الحالية.'); workspace.refresh(); }} />}
      {editorState.dirty && editing && <Typography variant="body2" color="text.secondary" mb={2}>مسودة الوظيفة غير محفوظة. احفظها أو ألغِها قبل تبديل الشركة.</Typography>}
      {!editing && <Box component="section" aria-label="وظائف الشركة" mt={3}>
        <Typography component="h2" variant="h5" fontWeight={700} mb={2}>وظائف الشركة</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField label="ابحث في وظائف الشركة" placeholder="العنوان أو الموقع أو المجال" value={filters.search} disabled={locked} inputProps={{ maxLength: 120 }} onChange={event => change({ q: event.target.value })} />
          <TextField select SelectProps={{ native: true }} label="حالة النشر" value={filters.view} disabled={locked} onChange={event => change({ view: event.target.value })}>{Object.entries(publicationViews).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</TextField>
          <TextField select SelectProps={{ native: true }} label="ترتيب الوظائف" value={filters.sort} disabled={locked} onChange={event => change({ sort: event.target.value })}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></TextField>
        </Box><Typography role="status" color="text.secondary" my={2}>{results.total} نتيجة من أصل {workspace.jobs.length} وظيفة للشركة</Typography>
        {!results.total && <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}><Typography component="h3" variant="h5" mb={1}>{workspace.jobs.length ? 'لا توجد وظائف مطابقة' : 'لا توجد وظائف لهذه الشركة بعد'}</Typography><Typography color="text.secondary">{workspace.jobs.length ? 'جرّب بحثًا آخر أو اعرض كل حالات النشر.' : 'اضغط «نشر وظيفة» لإضافة أول إعلان. لن تُنشأ أي وظيفة قبل حفظ النموذج.'}</Typography>{workspace.jobs.length > 0 && <Button color="inherit" disabled={locked} onClick={() => change({ view: 'all', q: '' })}>مسح البحث والتصفية</Button>}</Box>}
      </Box>}
      <Box display="grid" gap={2}>{!editing && results.items.map(job => { const state = publicationState(job, companyActive); return <Box key={job._id} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 0, overflowWrap: 'anywhere' }}><Box display="flex" gap={2} alignItems="center" flexWrap="wrap"><Typography component="h2" variant="h5">{job.title}</Typography><Chip size="small" label={state.label} color={state.tone} /></Box><Typography my={1}>{job.location || 'الموقع غير محدد'} · {job.job_type || 'نوع العمل غير محدد'}</Typography><Typography variant="body2" color="text.secondary" mb={1}>آخر يوم للتقديم بتوقيت فلسطين: {deadlineDay(job.deadline) || 'بدون موعد نهائي'}. تفعيل الوظيفة لا يجدد موعدها.</Typography><Typography variant="body2" mb={2}><bdi dir="ltr">{fmtSal({ ...job, salary_visible: true })}</bdi>{job.salary_visible === false ? ' — مبالغ محفوظة للإدارة فقط' : ' — راتب معلن'}</Typography><Box display="flex" flexWrap="wrap" gap={1}><Button color="inherit" disabled={locked || needsReview} aria-label={'تعديل ' + job.title} onClick={() => { setEditing(job); setMessage(''); setError(''); }}>تعديل</Button><Button color="inherit" disabled={locked || needsReview} aria-label={(job.is_active ? 'إيقاف ' : 'تفعيل ') + job.title} onClick={() => void setState(job)}>{job.is_active ? 'إيقاف' : 'تفعيل'}</Button><Button color="inherit" component={Link} disabled={locked} to={`/admin/applicants?company=${companyId}&job=${job._id}`}>المتقدمون</Button></Box></Box>; })}</Box>
      {!editing && results.pages > 1 && <Box component="nav" aria-label="صفحات وظائف الشركة" display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" gap={2} mt={3}><Button color="inherit" disabled={locked || results.page <= 1} onClick={() => change({ page: results.page - 1 })}>السابق</Button><Typography>الصفحة {results.page} من {results.pages}</Typography><Button color="inherit" disabled={locked || results.page >= results.pages} onClick={() => change({ page: results.page + 1 })}>التالي</Button></Box>}
    </>}
  </Box>;
}
