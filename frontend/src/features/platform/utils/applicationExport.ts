import { readApplicationReport, type ApplicationReport } from '../api/applicationReport';
import { historyDate } from '../api/applicationHistory';
import { applicationStatuses, safeDocumentUrl } from '../api/recruitment';
export interface ApplicationExportOptions { letter: boolean; cvLink: boolean; advertisement: boolean; history: boolean }
export const defaultApplicationExportOptions: ApplicationExportOptions = { letter: true, cvLink: false, advertisement: true, history: true };
export interface ApplicationExportBlock { kind: 'title' | 'heading' | 'subheading' | 'body' | 'meta'; text: string; dir: 'rtl' | 'ltr' | 'auto' }
export function applicationExportBlocks(input: ApplicationReport, options: ApplicationExportOptions): ApplicationExportBlock[] {
  const report = readApplicationReport({ ...input, success: true, history: { ...input.history, success: true } }, input.application_id);
  if (new TextEncoder().encode(JSON.stringify(report)).length > 1024 * 1024) throw new Error('بيانات الطلب كبيرة جدًا لتجهيز نسخة واحدة.');
  const blocks: ApplicationExportBlock[] = [];
  const add = (kind: ApplicationExportBlock['kind'], text: string, dir: ApplicationExportBlock['dir'] = 'auto') => {
    for (const line of text.replace(/\r\n?/g, '\n').split('\n')) blocks.push({ kind, text: line, dir });
  };
  add('title', 'طلب توظيف — نسخة للمراجعة', 'rtl'); add('subheading', report.title); add('body', report.company_name);
  add('meta', 'معرف الطلب', 'rtl'); add('meta', report.application_id, 'ltr');
  add('meta', 'تاريخ التقديم: ' + historyDate(report.application.submitted_at), 'rtl');
  add('meta', 'تاريخ إعداد النسخة: ' + historyDate(report.generated_at), 'rtl');
  add('body', 'حالة الطلب عند إعداد النسخة: ' + applicationStatuses[report.application.status], 'rtl');
  add('meta', 'تعكس النسخة البيانات التي حُمّلت عند إعدادها. حدّث طلبك لمراجعة أي تغييرات لاحقة.', 'rtl');
  if (report.names_source !== 'saved') add('meta', 'اسم الوظيفة والشركة مأخوذان من البيانات الحالية عند توفرها.', 'rtl');
  if (options.letter) { add('heading', 'رسالة التقديم', 'rtl'); add('body', report.application.cover_letter || 'لم تُرفق رسالة تقديم.'); }
  if (options.cvLink && report.application.cv_file) { add('heading', 'ملف السيرة المرفق', 'rtl'); add('body', report.application.cv_file.name); add('meta', 'حجم الملف: ' + report.application.cv_file.size.toLocaleString('ar') + ' بايت. يمكن تنزيله من الطلب؛ الملف نفسه غير مضمن في هذه النسخة.', 'rtl'); }
  if (options.cvLink && !report.application.cv_file) { add('heading', 'رابط السيرة المرفق', 'rtl'); const link = safeDocumentUrl(report.application.cv_url); add('body', link || (report.application.cv_url ? 'رابط السيرة المرفق غير صالح ولم يُدرج.' : 'لم يُرفق رابط سيرة ذاتية.'), link ? 'ltr' : 'rtl'); }
  if (options.advertisement) {
    add('heading', 'الإعلان المحفوظ مع الطلب', 'rtl');
    const saved = report.snapshot;
    if (!saved) add('body', 'لا تتوفر نسخة إعلان محفوظة مع هذا الطلب. لم تُستبدل بتفاصيل الإعلان الحالي.', 'rtl');
    else {
      const job = saved.job;
      add('meta', 'تاريخ حفظ الإعلان: ' + historyDate(saved.captured_at), 'rtl');
      add('meta', 'هذه النسخة للمراجعة، ولا تؤكد أن الوظيفة ما زالت متاحة.', 'rtl');
      add('subheading', job.title); add('body', saved.company.name_ar);
      for (const [label, value] of [['الموقع', job.location || job.region], ['نوع العمل', job.job_type], ['الخبرة', job.experience_level], ['المجال', job.field]]) if (value) add('meta', label + ': ' + value);
      const salary = job.salary_visible ? [job.salary_min, job.salary_max].filter(value => value !== null).map(value => value!.toLocaleString('ar')).join(' – ') : '';
      add('meta', 'الراتب: ' + (salary ? salary + ' ' + job.salary_currency : 'غير معلن'), 'rtl');
      add('meta', 'آخر موعد للتقديم في الإعلان: ' + (job.deadline ? historyDate(job.deadline) : 'غير محدد'), 'rtl');
      add('subheading', 'وصف الوظيفة', 'rtl'); add('body', job.description);
      if (job.requirements.length) { add('subheading', 'المتطلبات', 'rtl'); for (const value of job.requirements) add('body', '• ' + value); }
      if (job.benefits.length) { add('subheading', 'المزايا', 'rtl'); for (const value of job.benefits) add('body', '• ' + value); }
    }
  }
  if (options.history) {
    add('heading', 'سجل الحالة المتاح', 'rtl'); const history = report.history;
    if (history.truncated) add('meta', 'يُعرض آخر ' + history.events.length + ' حدث من ' + history.total_events + '. الأحداث الأقدم غير متاحة في هذه النسخة.', 'rtl');
    else if (!history.complete) add('meta', 'السجل السابق لبدء تسجيل حالات هذا الطلب غير متوفر.', 'rtl');
    if (!history.events.length) add('body', 'لا توجد أحداث مسجّلة لعرضها.', 'rtl');
    for (const event of [...history.events].reverse()) {
      add('subheading', event.from_status === null ? 'تم إرسال الطلب' : 'من «' + applicationStatuses[event.from_status] + '» إلى «' + applicationStatuses[event.to_status] + '»', 'rtl');
      add('meta', historyDate(event.at) + ' — ' + (event.actor_role === 'seeker' ? 'صاحب الطلب' : event.actor_role === 'company' ? 'الشركة' : 'إدارة المنصة'), 'rtl');
    }
  }
  return blocks;
}
const escape = (text: string) => text.replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[value]!));
export function printableApplication(input: ApplicationReport, options = defaultApplicationExportOptions): string {
  const blocks = applicationExportBlocks(input, options);
  const content = blocks.map(block => { const tag = block.kind === 'title' ? 'h1' : block.kind === 'heading' ? 'h2' : block.kind === 'subheading' ? 'h3' : 'p'; return `<${tag} class="${block.kind}" dir="${block.dir}">${escape(block.text) || '&#160;'}</${tag}>`; }).join('');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'"><title>نسخة طلب التوظيف</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}html,body{margin:0;color:#111;background:white;font-family:Arial,'DejaVu Sans',sans-serif;font-size:11pt;line-height:1.65}main{margin:auto;max-width:210mm;padding:12mm}h1,h2,h3,p{white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext;orphans:2;widows:2}h1{font-size:22pt;line-height:1.4;margin:0 0 10pt}h2{font-size:15pt;border-bottom:1px solid #bbb;padding-bottom:5pt;margin:20pt 0 8pt}h3{font-size:12pt;margin:12pt 0 5pt}h1,h2,h3{break-after:avoid;page-break-after:avoid}p{margin:4pt 0 8pt}.meta{font-size:10pt;color:#333}@media print{main{padding:0;max-width:none}html,body{width:auto;height:auto}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><main>${content}</main></body></html>`;
}
export function applicationExportFilename(id: string): string { return 'TTWar_Application_' + (id.replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0,70) || 'copy') + '.html'; }
