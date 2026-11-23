import { defaultCV, uid, type CVData } from './cv.types';

export interface SavedCV {
  updatedAt: string; builder_data?: CVData; template?: string; summary?: string;
  personal_info?: {full_name?:string;email?:string;phone?:string;location?:string;linkedin?:string;github?:string;website?:string;avatar_url?:string};
  skills?: {name:string;level?:string}[]; languages?: {name:string;level:string}[];
  experience?: {title?:string;company?:string;start_date?:string;end_date?:string;is_current?:boolean;description?:string;location?:string}[];
  education?: {institution?:string;degree?:string;field?:string;start_year?:number;end_year?:number;description?:string}[];
}
const levels: Record<string,string> = {'اللغة الأم':'Native','ممتاز':'Fluent','جيد':'Professional','متوسط':'Conversational','أساسي':'Basic'};
const legacyLevels: Record<string,string> = Object.fromEntries(Object.entries(levels).map(([key,value])=>[value,key]));
export function restoreCV(saved: SavedCV): CVData {
  if (saved.builder_data) return {...defaultCV(),...saved.builder_data};
  const personal=saved.personal_info || {}; const templateId=Number(saved.template);
  return {...defaultCV(),fullName:personal.full_name || '',email:personal.email || '',phone:personal.phone || '',location:personal.location || '',linkedin:personal.linkedin || '',github:personal.github || '',portfolio:personal.website || '',avatarUrl:personal.avatar_url || '',summary:saved.summary || '',
    templateId: Number.isInteger(templateId) && templateId>=1 && templateId<=10 ? templateId : 1,
    skills:saved.skills?.map(skill=>skill.name).filter(Boolean) || [],
    skillLevels:saved.skills?.map(skill=>({name:skill.name,level:skill.level || 'متوسط'})) || [],
    languages:saved.languages?.map(language=>({lang:language.name,level:levels[language.level] || 'Professional'})) || [],
    experience:saved.experience?.map(item=>({id:uid(),company:item.company || '',role:item.title || '',startDate:item.start_date || '',endDate:item.end_date || '',current:!!item.is_current,description:item.description || '',tech:[],location:item.location || ''})) || [],
    education:saved.education?.map(item=>({id:uid(),school:item.institution || '',degree:item.degree || '',field:item.field || '',startDate:item.start_year?.toString() || '',endDate:item.end_year?.toString() || '',gpa:'',description:item.description || ''})) || [],
  };
}
function webUrl(value:string) { if (!value.trim()) return ''; try {const parsed=new URL(/^https?:\/\//i.test(value) ? value : 'https://'+value); return ['https:','http:'].includes(parsed.protocol) ? parsed.href : '';} catch{return '';} }
export function cvPayload(cv: CVData) {
  const year=(value:string)=>{const match=value.match(/\b(19\d{2}|20\d{2}|21\d{2})\b/);return match?Number(match[1]):null;};
  return {builder_data:cv,template:String(cv.templateId),summary:cv.summary,
    personal_info:{full_name:cv.fullName,email:cv.email,phone:cv.phone,location:cv.location,linkedin:webUrl(cv.linkedin),github:webUrl(cv.github),website:webUrl(cv.portfolio),avatar_url:cv.avatarUrl || ''},
    education:cv.education.map(item=>({institution:item.school,degree:item.degree,field:item.field,start_year:year(item.startDate),end_year:year(item.endDate),description:item.description || ''})),
    skills:cv.skills.map(name=>({name,level:cv.skillLevels?.find(item=>item.name===name)?.level || 'متوسط'})),languages:cv.languages.map(item=>({name:item.lang,level:legacyLevels[item.level] || 'متوسط'})),
    experience:cv.experience.map(item=>({title:item.role,company:item.company,start_date:item.startDate,end_date:item.endDate,is_current:item.current,description:item.description,location:item.location || ''})),
  };
}
