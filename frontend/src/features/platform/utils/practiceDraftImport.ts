import {codeLanguages, type CodeLanguage} from './practice';
import type {CodeDrafts} from './practiceDrafts';

export const maxDraftFileBytes=2*1024*1024;
export interface ImportedDrafts {activeLanguage:CodeLanguage;problemId:string|null;drafts:CodeDrafts}
const isRecord=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function invalid():never {throw new Error('الملف ليس نسخة مسودات صالحة من المحرر. لم تتغير مسوداتك.');}
export function parseDraftBundle(text:string):ImportedDrafts {
  if(typeof text!=='string'||text.length>maxDraftFileBytes)throw new Error('ملف المسودات أكبر من الحد المسموح.');
  let data:unknown;
  try {data=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw new Error('تعذر قراءة ملف JSON. اختر نسخة مسودات نزّلتها من المحرر.');}
  if(!isRecord(data)||Object.keys(data).length!==5||['format','version','active_language','problem_id','drafts'].some(key=>!Object.hasOwn(data,key)))invalid();
  if(data.format!=='ttwar-playground'||data.version!==1||typeof data.active_language!=='string'||!Object.hasOwn(codeLanguages,data.active_language))invalid();
  if(!(data.problem_id===null||typeof data.problem_id==='string'&&data.problem_id.length>0&&data.problem_id.length<=160)||!isRecord(data.drafts))invalid();
  const languages=Object.keys(data.drafts);
  if(!languages.length||languages.length>5||!languages.includes(data.active_language)||languages.some(language=>!Object.hasOwn(codeLanguages,language)))invalid();
  const drafts:CodeDrafts={};
  for(const language of languages){
    const draft=data.drafts[language];
    if(!isRecord(draft)||Object.keys(draft).length!==2||!Object.hasOwn(draft,'code')||!Object.hasOwn(draft,'stdin')||typeof draft.code!=='string'||draft.code.length>50000||typeof draft.stdin!=='string'||draft.stdin.length>8000)invalid();
    drafts[language as CodeLanguage]={code:draft.code,stdin:draft.stdin};
  }
  return {activeLanguage:data.active_language as CodeLanguage,problemId:data.problem_id as string|null,drafts};
}
export async function readDraftFile(file:File):Promise<ImportedDrafts> {
  if(!/\.json$/i.test(file.name))throw new Error('اختر ملف مسودات بصيغة JSON.');
  if(!Number.isSafeInteger(file.size)||file.size<=0||file.size>maxDraftFileBytes)throw new Error('اختر ملفًا غير فارغ لا يتجاوز 2 ميغابايت.');
  const buffer=await file.slice(0,maxDraftFileBytes+1).arrayBuffer();
  if(buffer.byteLength>maxDraftFileBytes)throw new Error('ملف المسودات أكبر من الحد المسموح.');
  let text:string;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);}catch{throw new Error('ترميز الملف غير صالح. استخدم نسخة UTF-8 نزّلتها من المحرر.');}
  return parseDraftBundle(text);
}
export function mergeImportedDrafts(existing:CodeDrafts,imported:ImportedDrafts):CodeDrafts {
  const merged={...existing};
  for(const language of Object.keys(codeLanguages) as CodeLanguage[]){
    const draft=imported.drafts[language];
    if(draft)merged[language]={code:draft.code,stdin:draft.stdin};
  }
  return merged;
}
