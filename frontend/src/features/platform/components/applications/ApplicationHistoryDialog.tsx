import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { historyDate, type ApplicationHistory } from '../../api/applicationHistory';
import { applicationStatuses, type ApplicationRecord } from '../../api/recruitment';
import type { MyApplicationsClient } from '../../api/myApplicationsClient';
import './ApplicationJobDialog.css';
import './ApplicationHistoryDialog.css';

export default function ApplicationHistoryDialog({ application, client, onClose }: { application: ApplicationRecord; client: MyApplicationsClient; onClose: (latest?: ApplicationHistory) => void }) {
  const [read, setRead] = useState<{ loading: boolean; error: string; data: ApplicationHistory | null }>({ loading: true, error: '', data: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const request = new AbortController(); setRead({ loading: true, error: '', data: null });
    void client.history(application, request.signal).then(data => { if (!request.signal.aborted) setRead({ loading: false, error: '', data }); })
      .catch(failure => { if (!request.signal.aborted) setRead({ loading: false, error: failure instanceof Error ? failure.message : 'تعذر تحميل سجل الطلب.', data: null }); });
    return () => request.abort();
  }, [application, client, retry]);
  const title = (typeof application.job_id === 'object' ? application.job_id?.title : null) || application.snapshot_title || 'طلب التوظيف';
  const close = () => onClose(read.data || undefined);
  return <Dialog open onClose={close} fullWidth maxWidth="sm" scroll="paper" dir="rtl" aria-labelledby="application-history-title" aria-describedby="application-history-note" PaperProps={{ className: 'application-job-dialog application-history-dialog' }}>
    <DialogTitle id="application-history-title">سجل حالة الطلب</DialogTitle><DialogContent dividers>
      <h2>{title}</h2><p id="application-history-note" className="application-job-note">التحديثات المسجّلة على المنصة. قد تختلف الحالة عن آخر مرة فتحت فيها قائمة طلباتك.</p>
      {read.loading && <p role="status">جارٍ تحميل سجل الطلب…</p>}
      {read.error && <Alert severity="error"><p>{read.error}</p><Button color="inherit" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</Button></Alert>}
      {read.data && <>
        <p className="application-history-current">الحالة الحالية: <strong>{applicationStatuses[read.data.status]}</strong></p><p className="application-job-note">تاريخ التقديم: {historyDate(read.data.submitted_at)}</p>
        {read.data.truncated ? <Alert severity="info">يُعرض آخر {read.data.events.length.toLocaleString('ar')} حدث من {read.data.total_events.toLocaleString('ar')}. الأحداث الأقدم غير معروضة.</Alert> : !read.data.complete ? <Alert severity="info">هذا الطلب أقدم من بدء تسجيل حالاته. التغييرات السابقة غير متوفرة.{read.data.history_started_at ? ' يبدأ السجل المتاح من ' + historyDate(read.data.history_started_at) + '.' : ''}</Alert> : null}
        {!read.data.events.length && <p className="application-history-empty">لا توجد تغييرات مسجّلة لعرضها.</p>}
        <ol className="application-history-list" aria-label="تغييرات حالة الطلب، الأحدث أولًا">{[...read.data.events].reverse().map(event => <li key={event.version}>
          <h3>{event.from_status === null ? 'تم إرسال الطلب' : applicationStatuses[event.to_status]}</h3>
          {event.from_status !== null && <p>من «{applicationStatuses[event.from_status]}» إلى «{applicationStatuses[event.to_status]}»</p>}
          <p className="application-history-actor">{event.actor_role === 'seeker' ? 'بواسطة صاحب الطلب' : event.actor_role === 'company' ? 'بواسطة الشركة' : 'بواسطة إدارة المنصة'}</p><time dateTime={event.at}>{historyDate(event.at)}</time>
        </li>)}</ol>
      </>}
    </DialogContent><DialogActions><Button color="inherit" onClick={close}>العودة إلى طلباتي</Button></DialogActions>
  </Dialog>;
}
