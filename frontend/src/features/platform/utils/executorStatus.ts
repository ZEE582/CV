import {codeLanguages,type CodeLanguage} from './practice';
export type ExecutorState='unconfigured'|'unverifiable'|'unreachable'|'invalid_response'|'missing_runtimes'|'partial'|'ready';
export interface ExecutorStatus {
  success:true;configured:boolean;available:boolean;host:string|null;languages:CodeLanguage[];
  installed_languages:CodeLanguage[];state:ExecutorState;checked_at:string|null;
  max_code_chars:50000;max_stdin_chars:8000;
}
export function validExecutorStatus(value:unknown):value is ExecutorStatus {
  const data=value as ExecutorStatus;
  if(!data||data.success!==true||typeof data.configured!=='boolean'||typeof data.available!=='boolean'||!(data.host===null||typeof data.host==='string'&&data.host.length>0&&data.host.length<=255)||data.configured!==!!data.host||!Array.isArray(data.languages)||data.languages.length!==5||Object.keys(codeLanguages).some(language=>!data.languages.includes(language as CodeLanguage))||!Array.isArray(data.installed_languages)||data.installed_languages.length>5||new Set(data.installed_languages).size!==data.installed_languages.length||data.installed_languages.some(language=>!Object.hasOwn(codeLanguages,language))||data.available!==(data.installed_languages.length>0)||data.max_code_chars!==50000||data.max_stdin_chars!==8000)return false;
  if(!(data.checked_at===null||typeof data.checked_at==='string'&&data.checked_at.length<=35&&Number.isFinite(Date.parse(data.checked_at))))return false;
  if(!data.configured)return data.state==='unconfigured'&&!data.available&&data.checked_at===null;
  if(data.state==='unverifiable')return !data.available&&data.checked_at===null;
  if(!data.checked_at)return false;
  if(data.installed_languages.length===5)return data.state==='ready';
  if(data.available)return data.state==='partial';
  return ['unreachable','invalid_response','missing_runtimes'].includes(data.state);
}
export function executorStatusMessage(status:ExecutorStatus){
  const messages:Record<ExecutorState,string>={
    unconfigured:'خدمة تنفيذ الكود غير مهيأة حاليًا. يمكنك تجهيز مسوداتك وتنزيلها.',
    unverifiable:'تعذر التحقق من إعداد خدمة التنفيذ. راجع مسؤول المنصة، ويمكنك متابعة تجهيز الكود.',
    unreachable:'تعذر الاتصال بخدمة التنفيذ. مسوداتك باقية؛ يمكنك متابعة الكتابة والتنزيل.',
    invalid_response:'وصل رد غير متوافق من خدمة التنفيذ. التشغيل متوقف حتى التحقق منها.',
    missing_runtimes:'الخدمة متصلة، لكن لغات المحرر غير مثبتة لديها حاليًا.',
    partial:`الخدمة متصلة. تتوفر ${status.installed_languages.length} من 5 لغات للتشغيل.`,
    ready:'الخدمة متصلة، ولغات المحرر الخمس متاحة حسب آخر فحص.',
  };
  return messages[status.state];
}
export function executorCheckedTime(status:ExecutorStatus){
  return status.checked_at?new Intl.DateTimeFormat('ar-PS',{timeZone:'Asia/Hebron',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(status.checked_at)):'';
}
