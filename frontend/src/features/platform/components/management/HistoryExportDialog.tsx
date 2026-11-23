import { useEffect, useId, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Typography } from '@mui/material';
import { defaultHistoryExportOptions, historyExportDocument, requestHistoryExportDownload, type HistoryExportSnapshot } from '../../utils/historyPageExport';
import { historyActions } from '../../utils/historyFeed';
import { historyFieldLabels, historyStateText } from '../../utils/managementHistoryLabels';

export default function HistoryExportDialog({ snapshot, isCurrent, onClose }: { snapshot: HistoryExportSnapshot; isCurrent: () => boolean; onClose: () => void }) {
  const [options, setOptions] = useState({ ...defaultHistoryExportOptions }); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const id = useId();
  const preview = useMemo(() => { try { return { data: historyExportDocument(snapshot, options), error: '' }; } catch { return { data: null, error: 'تعذر تجهيز نسخة صالحة. أغلق المعاينة وحدّث النتائج.' }; } }, [snapshot, options]);
  useEffect(() => { setMessage(''); setError(''); }, [options]);
  const current = isCurrent(); const data = preview.data;
  function download(format: 'csv' | 'json') {
    setMessage(''); setError('');
    if (!isCurrent()) { setError('تغيّرت الجلسة أو نتائج الصفحة. أغلق المعاينة وحدّث النتائج.'); return; }
    try { requestHistoryExportDownload(snapshot, options, format, isCurrent); setMessage('طُلب تنزيل ملف ' + format.toUpperCase() + '. تحقق من حفظه في تنزيلات المتصفح.'); }
    catch { setError('تعذر طلب تنزيل النسخة. تحقق من الجلسة والنتائج وحاول مجددًا.'); }
  }
  return <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby={id} aria-describedby={id + '-scope'} PaperProps={{ dir: 'rtl', sx: { m: 2, width: 'calc(100% - 32px)', fontFamily: "'Tajawal','Segoe UI',sans-serif", '& .MuiTypography-root,& .MuiButton-root,& .MuiAlert-root': { fontFamily: 'inherit', overflowWrap: 'anywhere' }, '& .MuiTypography-body1,& .MuiAlert-message,& .MuiButton-root': { fontSize: 14, lineHeight: 1.8 }, '& .MuiDialogTitle-root': { fontSize: 22, fontWeight: 800 }, '& .MuiButton-root': { minHeight: 44 } } }}>
    <DialogTitle id={id}>تصدير الصفحة المحمّلة</DialogTitle><DialogContent dividers>
      <Alert severity="info" id={id + '-scope'}>الملف يضم عمليات هذه الصفحة فقط، ولا يشمل بقية صفحات البحث أو كامل التاريخ. لم تُطلب بيانات إضافية من الخادم.</Alert>
      <Typography my={2}>الصفحة {snapshot.data.page} · {snapshot.data.items.length} عملية من {snapshot.data.total} نتيجة محفوظة مطابقة.</Typography>
      <Typography color="text.secondary">وقت تجهيز النسخة UTC: <bdi>{snapshot.capturedAt}</bdi></Typography>
      <Typography color="text.secondary" mt={1}>هذه نسخة ثابتة من البيانات المحمّلة عند فتح المعاينة. قد توجد تغييرات أحدث في القاعدة.</Typography>
      <Box component="fieldset" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, my: 3, minWidth: 0 }}><Typography component="legend" px={1}>البيانات التعريفية الاختيارية</Typography>
        <FormControlLabel sx={{ display: 'flex', m: 0 }} label="إضافة الأسماء الحالية للأهداف والمنفّذين" control={<Checkbox checked={options.names} onChange={event => setOptions(previous => ({ ...previous, names: event.target.checked }))} />} />
        <FormControlLabel sx={{ display: 'flex', m: 0 }} label="إضافة معرّفات السجلات والمنفّذين ومراجع الطلبات" control={<Checkbox checked={options.identifiers} onChange={event => setOptions(previous => ({ ...previous, identifiers: event.target.checked }))} />} />
      </Box>
      <Typography color="text.secondary">عند استبعاد الأسماء والمعرّفات، تُستخدم مراجع محلية مثل «حساب 1» و«منفّذ 1» لتمييز السجلات داخل الملف. بيانات الحالة والتوقيت تبقى موجودة.</Typography>
      {(options.names || options.identifiers) && <Alert severity="warning" sx={{ my: 2 }}>ستتضمن النسخة البيانات التعريفية التي اخترتها، بما فيها قيم فلاتر الاسم أو المعرّف ذات الصلة. راجعها قبل الحفظ والمشاركة.</Alert>}
      {!current && <Alert severity="warning" sx={{ my: 2 }}>تغيّرت الجلسة أو النتائج. أغلق المعاينة وحدّث الصفحة قبل التصدير.</Alert>}
      {(preview.error || error) && <Alert severity="error" sx={{ my: 2 }}>{preview.error || error}</Alert>}{message && <Typography role="status" my={2}>{message}</Typography>}
      {data && <Box mt={3}><Typography component="h2" variant="h5" fontWeight={700}>معاينة البيانات المختارة</Typography><Typography color="text.secondary" mt={1}>تظهر أول {Math.min(data.events.length, 3)} عمليات هنا؛ الملف يضم عمليات الصفحة الـ{data.events.length} كلها.</Typography>
        <Box component="ol" sx={{ p: 0, m: 0 }}>{data.events.slice(0, 3).map((event, index) => <Box component="li" key={index} sx={{ listStyle: 'none', py: 2, borderBottom: '1px solid', borderColor: 'divider', overflowWrap: 'anywhere' }}>
          <Typography fontWeight={700}>{event.target_ref} · {historyActions[event.action]}</Typography><Typography>المنفّذ داخل النسخة: {event.actor_ref} · {event.actor_role === 'admin' ? 'مدير' : 'مسؤول الشركة'}</Typography><Typography><bdi>{event.at}</bdi> UTC</Typography>
          <Typography>الحقول: {event.fields.map(field => historyFieldLabels[field]).join('، ') || 'حفظ دون تغيير في قيم الحقول'}</Typography>{event.before && <Typography>قبل الحفظ: {historyStateText(event.before)}</Typography>}<Typography>بعد الحفظ: {historyStateText(event.after)}</Typography>
          {options.names && <><Typography>اسم الهدف الحالي: {event.target_name || 'اسم غير متاح'}</Typography><Typography>اسم المنفّذ الحالي: {event.actor_name || 'اسم غير متاح'}</Typography></>}
          {options.identifiers && event.references && <><Typography>معرّف الهدف: <bdi>{event.references.target_id}</bdi></Typography><Typography>معرّف المنفّذ: <bdi>{event.references.actor_id}</bdi></Typography><Typography>مرجع الطلب: <bdi>{event.references.request_id}</bdi> · النسخة {event.references.revision}</Typography></>}
        </Box>)}</Box>
      </Box>}
      <Typography color="text.secondary" mt={2}>CSV مناسب لجداول البيانات، وJSON للقراءة البرمجية. تُعامل القيم التي تشبه صيغ الجداول كنص في CSV، وقد تظهر قبلها بادئة نصية.</Typography>
    </DialogContent><DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}><Button color="inherit" onClick={onClose}>إغلاق دون تنزيل</Button><Button color="inherit" disabled={!current || !data || !!preview.error} onClick={() => download('json')}>تنزيل JSON</Button><Button color="secondary" variant="contained" disabled={!current || !data || !!preview.error} onClick={() => download('csv')}>تنزيل CSV</Button></DialogActions>
  </Dialog>;
}
