import {API_BASE_URL} from '../../../shared/api';
import {defaultCV,type CVData} from '../components/cv/cv.types';
import {cvPayload,restoreCV,type SavedCV} from '../components/cv/cv.persistence';
import {cvIssue,validCV} from '../components/cv/cv.validation';
export class CVError extends Error{constructor(message:string,public status=0){super(message);}}
const tokenNow=()=>{try{return localStorage.getItem('token');}catch{return null;}};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-f\d]{24}$/i.test(v);
export function createCVClient(accountId?:string){
 const token=tokenNow();let loadedId:string|null=null;
 function checkSession(){if(!accountId||!token||tokenNow()!==token)throw new CVError('تغيّرت جلسة الحساب أو انتهت. احتفظ بعملك وسجّل الدخول مجددًا.',401);}
 async function request(path:string,options:RequestInit){
  checkSession();let response:Response;
  try{response=await fetch(API_BASE_URL+path,{...options,credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})}});}catch(error){if(options.signal?.aborted)throw error;throw new CVError('تعذر الاتصال. بقيت تعديلاتك في الصفحة؛ تحقق من النسخة المحفوظة قبل إعادة الحفظ.');}
  const data:unknown=await response.json().catch(()=>null);checkSession();if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  if(response.status===404&&object(data)&&data.success===false&&data.code==='CV_NOT_FOUND')return null;
  if(!response.ok)throw new CVError(response.status===401?'انتهت الجلسة. احتفظ بعملك وسجّل الدخول مجددًا.':response.status===409?'توجد نسخة أحدث في حسابك. بقيت تعديلاتك هنا؛ راجعها قبل اختيار استرجاع المحفوظ.':response.status===400?'رفض الخادم بعض البيانات. راجع الحقول وأطوال النصوص.':response.status===413?'حجم السيرة أكبر من المسموح. قلّل النصوص قبل الحفظ.':'تعذر إكمال الطلب. لم يُؤكّد الحفظ، وبقيت تعديلاتك هنا.',response.status);
  if(!object(data)||data.success!==true)throw new CVError('لم يصل تأكيد صالح. لم تُعتمد نسخة محفوظة.');return data;
 }
 return {
  async load(signal?:AbortSignal){
   const data=await request('/cv/my',{signal});if(data===null){loadedId=null;return {cv:defaultCV(),updatedAt:null};}
   const row=data.cv;if(!object(row)||row.user_id!==accountId||!id(row._id)||!date(row.updatedAt))throw new CVError('لا تتطابق السيرة المسترجعة مع حسابك أو تعذر قراءة نسختها.');
   let cv:CVData;try{if(row.builder_data!==undefined&&!object(row.builder_data))throw new Error();cv=restoreCV(row as unknown as SavedCV);if(!validCV(cv))throw new Error();}catch{throw new CVError('تعذر قراءة حقول السيرة المحفوظة. لم تُستبدل تعديلاتك.');}
   loadedId=row._id;return {cv,updatedAt:row.updatedAt};
  },
  async save(cv:CVData,updatedAt:string|null,signal?:AbortSignal){
   checkSession();const issue=cvIssue(cv);if(issue)throw new CVError(issue,400);if(updatedAt!==null&&!date(updatedAt))throw new CVError('استرجع نسخة محفوظة صالحة قبل الحفظ.');
   const body=JSON.stringify({...cvPayload(cv),expected_updated_at:updatedAt});if(new TextEncoder().encode(body).length>1024*1024)throw new CVError('حجم السيرة يتجاوز 1 ميغابايت. قلّل النصوص قبل الحفظ.',413);
   const data=await request('/cv',{method:'POST',body,signal});
   if(!data||!id(data.cv_id)||(loadedId!==null&&data.cv_id!==loadedId)||!date(data.updatedAt)||(updatedAt!==null&&Date.parse(data.updatedAt)<Date.parse(updatedAt)))throw new CVError('لم يصل تأكيد حفظ مطابق. بقيت تعديلاتك؛ استرجع المحفوظ للتحقق قبل إعادة المحاولة.');
   loadedId=data.cv_id;return {updatedAt:data.updatedAt};
  },
 };
}
export type CVClient=ReturnType<typeof createCVClient>;
