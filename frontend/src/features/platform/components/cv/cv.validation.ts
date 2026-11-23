import type {CVData} from './cv.types';
type Row=Record<string,unknown>;
const record=(v:unknown):v is Row=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max;
const texts=(v:unknown)=>Array.isArray(v)&&v.length<=100&&v.every(item=>text(item,200));
const rows=(v:unknown,check:(r:Row)=>boolean)=>Array.isArray(v)&&v.length<=100&&v.every(r=>record(r)&&check(r));
function fields(r:Row,limits:Record<string,number>,optional:string[]=[]){return Object.entries(limits).every(([k,max])=>optional.includes(k)&&r[k]===undefined||text(r[k],max));}
export function cvIssue(v:unknown):string {
 if(!record(v))return 'تعذر قراءة بيانات السيرة.';
 if(!fields(v,{fullName:200,jobTitle:300,email:254,phone:100,location:300,linkedin:2048,github:2048,portfolio:2048,avatarUrl:2048,summary:20000},['avatarUrl']))return 'راجع المعلومات الشخصية: الاسم حتى 200 حرف، والمسمى والموقع حتى 300، والهاتف حتى 100، والروابط حتى 2048، والملخص حتى 20000.';
 if(v.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v.email)))return 'أدخل بريدًا إلكترونيًا صالحًا دون مسافات، أو اتركه فارغًا.';
 if(!Number.isInteger(v.templateId)||Number(v.templateId)<1||Number(v.templateId)>10||typeof v.accentColor!=='string'||!/^#[\da-f]{6}$/i.test(v.accentColor))return 'اختر قالبًا ولونًا صالحين.';
 if(!texts(v.skills)||v.skillLevels!==undefined&&!rows(v.skillLevels,r=>text(r.name,200)&&['مبتدئ','متوسط','متقدم','خبير'].includes(String(r.level))))return 'راجع المهارات: حتى 100 مهارة، و200 حرف للاسم، مع مستوى صالح.';
 if(!rows(v.languages,r=>text(r.lang,100)&&['Native','Fluent','Professional','Conversational','Basic'].includes(String(r.level))))return 'راجع اللغات: حتى 100 لغة، و100 حرف للاسم، مع مستوى صالح.';
 if(!rows(v.experience,r=>fields(r,{id:64,company:300,role:300,startDate:100,endDate:100,description:20000,location:300},['location'])&&typeof r.current==='boolean'&&texts(r.tech)))return 'راجع الخبرة العملية: حتى 100 سجل، و300 حرف للاسم، و100 للتاريخ، و20000 للوصف.';
 if(!rows(v.education,r=>fields(r,{id:64,school:300,degree:300,field:300,startDate:100,endDate:100,gpa:100,description:20000},['description'])))return 'راجع التعليم: حتى 100 سجل، و300 حرف للأسماء، و100 للتاريخ والمعدل، و20000 للوصف.';
 if(!rows(v.projects,r=>fields(r,{id:64,name:300,description:20000,url:2048,github:2048})&&texts(r.tech)))return 'راجع المشاريع: حتى 100 مشروع، و300 حرف للاسم، و20000 للوصف، و2048 للرابط.';
 if(!rows(v.certifications,r=>fields(r,{id:64,name:300,issuer:300,date:100,url:2048})))return 'راجع الشهادات: حتى 100 شهادة، و300 حرف للاسم والجهة، و100 للتاريخ، و2048 للرابط.';
 return '';
}
export function validCV(v:unknown):v is CVData{return cvIssue(v)==='';}
