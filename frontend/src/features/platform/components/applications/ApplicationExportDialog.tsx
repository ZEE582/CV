import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel } from '@mui/material';
import type { ApplicationReport } from '../../api/applicationReport';
import type { MyApplicationsClient } from '../../api/myApplicationsClient';
import type { ApplicationRecord } from '../../api/recruitment';
import { applicationExportFilename, defaultApplicationExportOptions, printableApplication } from '../../utils/applicationExport';
import './ApplicationJobDialog.css';
import './ApplicationExportDialog.css';

export default function ApplicationExportDialog({ application, client, onClose }: { application: ApplicationRecord; client: MyApplicationsClient; onClose: (latest?: ApplicationReport) => void }) {
  const [read, setRead] = useState<{ loading: boolean; error: string; data: ApplicationReport | null }>({ loading: true, error: '', data: null });
  const [retry, setRetry] = useState(0); const [options, setOptions] = useState({ ...defaultApplicationExportOptions });
  const [readyHtml, setReadyHtml] = useState(''); const [actionError, setActionError] = useState(''); const [message, setMessage] = useState('');
  const frame = useRef<HTMLIFrameElement>(null);
  const deadline = useRef<number | null>(null); const loadedHtml = useRef('');
  useEffect(() => {
    const request = new AbortController(); setRead({ loading: true, error: '', data: null });
    void client.report(application, request.signal).then(data => { if (!request.signal.aborted) setRead({ loading: false, error: '', data }); })
      .catch(failure => { if (!request.signal.aborted) setRead({ loading: false, error: failure instanceof Error ? failure.message : 'تعذر تجهيز نسخة الطلب.', data: null }); });
    return () => request.abort();
  }, [application, client, retry]);
  const preview = useMemo(() => {
    if (!read.data) return { html: '', error: '' };
    try { return { html: printableApplication(read.data, options), error: '' }; }
    catch (failure) { return { html: '', error: failure instanceof Error ? failure.message : 'تعذر تجهيز المعاينة.' }; }
  }, [read.data, options]);
  useEffect(() => {
    setActionError(''); setMessage('');
    if (!preview.html || loadedHtml.current === preview.html) return;
    deadline.current = window.setTimeout(() => setActionError('تأخر تجهيز المعاينة. أغلقها وحاول مجددًا.'), 15000);
    return () => { if (deadline.current !== null) window.clearTimeout(deadline.current); };
  }, [preview.html]);
  const ready = !!preview.html && readyHtml === preview.html;
  async function loaded(html: string, element: HTMLIFrameElement) {
    const document = element.contentDocument;
    if (!document) return;
    try { await document.fonts.ready; if (frame.current === element && element.contentDocument === document) { if (deadline.current !== null) window.clearTimeout(deadline.current); loadedHtml.current = html; setReadyHtml(html); setActionError(''); } }
    catch { setActionError('تعذر تجهيز الطباعة. يمكنك تنزيل نسخة HTML وفتحها في المتصفح.'); }
  }
  function print() {
    if (!ready || !client.isCurrent()) return;
    try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); }
    catch { setActionError('تعذر فتح نافذة الطباعة. يمكنك تنزيل نسخة HTML وفتحها في المتصفح.'); }
  }
  function download() {
    if (!preview.html || !read.data || !client.isCurrent()) return;
    const url = URL.createObjectURL(new Blob([preview.html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = applicationExportFilename(read.data.application_id); document.body.appendChild(link);
    try { link.click(); setMessage('طُلب تنزيل نسخة HTML. تحقق من حفظها في تنزيلات المتصفح.'); }
    catch { setActionError('تعذر طلب تنزيل النسخة. حاول مجددًا.'); }
    finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000); }
  }
  const close = () => onClose(read.data || undefined);
  return <Dialog open onClose={close} fullWidth maxWidth="lg" scroll="paper" dir="rtl" aria-labelledby="application-export-title" aria-describedby="application-export-note" PaperProps={{ className: 'application-job-dialog application-export-dialog' }}>
    <DialogTitle id="application-export-title">نسخة طلب التوظيف</DialogTitle><DialogContent dividers>
      <p id="application-export-note" className="application-job-note">راجع البيانات والأقسام قبل حفظ نسختك على الجهاز. اختر «حفظ بصيغة PDF» من نافذة الطباعة، أو نزّل نسخة HTML قابلة للطباعة.</p>
      {read.loading && <p role="status">جارٍ تجهيز نسخة الطلب…</p>}
      {read.error && <Alert severity="error"><p>{read.error}</p><Button color="inherit" onClick={() => setRetry(value => value + 1)}>إعادة المحاولة</Button></Alert>}
      {read.data && <><fieldset className="application-export-options"><legend>الأقسام المرفقة</legend>{([['letter','رسالة التقديم'],['cvLink','بيانات السيرة المرفقة'],['advertisement','تفاصيل الإعلان المحفوظ'],['history','سجل الحالات المتاح']] as const).map(([key,label]) => <FormControlLabel key={key} label={label} control={<Checkbox checked={options[key]} onChange={event => setOptions(previous => ({ ...previous, [key]: event.target.checked }))} />} />)}</fieldset>
        {preview.error && <Alert severity="error">{preview.error}</Alert>}{actionError && <Alert severity="warning">{actionError}</Alert>}{message && <p role="status">{message}</p>}
        {preview.html && <><p className="application-job-note">إلغاء نافذة الطباعة لا يؤكد حفظ ملف. تبقى الأقسام غير المحددة خارج النسخة.</p>{!ready && !actionError && <p role="status">جارٍ تجهيز المعاينة…</p>}<iframe key={preview.html} ref={frame} title="معاينة نسخة طلب التوظيف" sandbox="allow-same-origin allow-modals" srcDoc={preview.html} onLoad={event => void loaded(preview.html, event.currentTarget)} /></>}
      </>}
    </DialogContent><DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}><Button color="inherit" onClick={close}>العودة إلى طلباتي</Button><Button color="inherit" disabled={!preview.html} onClick={download}>تنزيل HTML</Button><Button variant="contained" disabled={!ready || !preview.html} onClick={print}>طباعة / حفظ PDF</Button></DialogActions>
  </Dialog>;
}
