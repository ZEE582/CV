import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { MyApplicationsClient } from '../../api/myApplicationsClient';
import type { ApplicationJobDetails } from '../../api/applicationJobDetails';
import type { ApplicationRecord } from '../../api/recruitment';
import { applicantDate } from '../../utils/applicants';
import './ApplicationJobDialog.css';

export default function ApplicationJobDialog({ application, client, onClose }: { application: ApplicationRecord; client: MyApplicationsClient; onClose: () => void }) {
  const [read, setRead] = useState<{ loading: boolean; error: string; data: ApplicationJobDetails | null }>({ loading: true, error: '', data: null });
  const [retry, setRetry] = useState(0);
  const [source, setSource] = useState<'saved' | 'current'>('saved');
  useEffect(() => {
    const controller = new AbortController(); setRead({ loading: true, error: '', data: null });
    void client.jobDetails(application, controller.signal).then(data => { if (!controller.signal.aborted) setRead({ loading: false, error: '', data }); })
      .catch(failure => { if (!controller.signal.aborted) setRead({ loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل تفاصيل الوظيفة.', data: null }); });
    return () => controller.abort();
  }, [application, client, retry]);
  const saved = read.data?.snapshot;
  const showingSaved = !!saved && source === 'saved';
  const job = showingSaved ? saved.job : read.data?.job;
  const company = showingSaved ? saved.company : read.data?.company;
  const expired = !!job?.deadline && Date.parse(job.deadline) < Date.now();
  const salary = !job?.salary_visible || (job.salary_min === null && job.salary_max === null) ? 'غير معلن' : [job.salary_min?.toLocaleString('ar'), job.salary_max?.toLocaleString('ar')].filter(Boolean).join(' – ') + ' ' + job.salary_currency;
  return <Dialog open onClose={onClose} fullWidth maxWidth="md" scroll="paper" dir="rtl" aria-labelledby="application-job-title" aria-describedby="application-job-note" PaperProps={{ className: 'application-job-dialog' }}>
    <DialogTitle id="application-job-title">تفاصيل الوظيفة المرتبطة بطلبك</DialogTitle>
    <DialogContent dividers>
      <p id="application-job-note" className="application-job-note">{showingSaved ? 'نسخة الإعلان التي حفظها الخادم أثناء استقبال طلبك. قد تختلف عن الإعلان الحالي.' : 'هذه التفاصيل الحالية للوظيفة، وقد تختلف عما كان منشورًا وقت تقديمك.'}</p>
      {saved && <><div className="application-job-sources" role="group" aria-label="نسخة إعلان الوظيفة"><button type="button" aria-pressed={showingSaved} onClick={() => setSource('saved')}>الإعلان المحفوظ مع الطلب</button><button type="button" aria-pressed={!showingSaved} onClick={() => setSource('current')}>الإعلان الحالي</button></div><p className="application-job-note">حُفظ الإعلان بتاريخ {applicantDate(saved.captured_at)}{saved.job_updated_at ? '، وآخر تعديل للوظيفة وقتها: ' + applicantDate(saved.job_updated_at) : ''}.</p></>}
      {!read.loading && !read.error && read.data && !saved && <Alert severity="info">لا توجد نسخة إعلان محفوظة مع هذا الطلب. التفاصيل المعروضة حالية فقط.</Alert>}
      {read.loading && <p role="status">جارٍ تحميل تفاصيل الوظيفة…</p>}
      {read.error && <Alert severity="error"><p>{read.error}</p><Button color="inherit" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</Button></Alert>}
      {!read.loading && !read.error && read.data && !job && <Alert severity="info">تفاصيل الوظيفة لم تعد متاحة لهذا الطلب. يبقى طلبك وحالته ظاهرين في قائمة طلباتك.</Alert>}
      {!read.loading && !read.error && job && <>
        <p className="application-job-company">{company?.name_ar || 'شركة غير متاحة'}</p><h2>{job.title}</h2>
        {showingSaved ? <Alert severity="info">هذه نسخة محفوظة للمراجعة؛ لا تُثبت أن الوظيفة ما زالت متاحة للتقديم.</Alert> : !job.is_active ? <Alert severity="info">الوظيفة موقوفة حاليًا. يمكنك مراجعة تفاصيلها هنا.</Alert> : !company?.is_active ? <Alert severity="info">الشركة غير متاحة حاليًا. يمكنك مراجعة تفاصيل الوظيفة هنا.</Alert> : expired ? <Alert severity="info">انتهى موعد التقديم على هذه الوظيفة.</Alert> : null}
        <dl className="application-job-meta">{[['الموقع', job.location || (job.region === 'remote' ? 'عن بُعد' : job.region) || 'غير محدد'], ['نوع العمل', job.job_type || 'غير محدد'], ['الخبرة', job.experience_level || 'غير محددة'], ['المجال', job.field || 'غير محدد'], ['الراتب', salary], ['آخر موعد للتقديم', job.deadline ? applicantDate(job.deadline) : 'غير محدد']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <section><h3>وصف الوظيفة</h3><p className="application-job-description">{job.description || 'لم يُضف وصف للوظيفة.'}</p></section>
        {!!job.requirements.length && <section><h3>المتطلبات</h3><ul>{job.requirements.map((value, index) => <li key={index}>{value}</li>)}</ul></section>}
        {!!job.benefits.length && <section><h3>المزايا</h3><ul>{job.benefits.map((value, index) => <li key={index}>{value}</li>)}</ul></section>}
      </>}
    </DialogContent><DialogActions><Button color="inherit" onClick={onClose}>العودة إلى طلباتي</Button></DialogActions>
  </Dialog>;
}
