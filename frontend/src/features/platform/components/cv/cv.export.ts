import type {CVData} from './cv.types';
import {cvIssue} from './cv.validation';
export type ExportBlock={kind:'title'|'subtitle'|'heading'|'body'|'meta';text:string;dir:'rtl'|'ltr'};
export function textDirection(text:string):'rtl'|'ltr'{const first=text.match(/\p{L}/u)?.[0]||'';return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(first)?'rtl':'ltr';}
export function exportFilename(name:string,extension:'docx'|'pdf'){
 const clean=Array.from(name.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'_')).slice(0,70).join('').replace(/[. ]+$/g,'').trim();return (clean||'CV')+'_Resume.'+extension;
}
export function cvExportBlocks(cv:CVData):ExportBlock[]{
 const issue=cvIssue(cv);if(issue)throw new Error(issue);
 const serialized=JSON.stringify(cv);if(new TextEncoder().encode(serialized).length>1024*1024)throw new Error('حجم السيرة كبير جدًا للتصدير. قلّل النصوص ثم حاول مجددًا.');
 function checkXML(value:unknown){if(typeof value==='string'){for(const character of Array.from(value)){const cp=character.codePointAt(0)!;if(cp<32&&![9,10,13].includes(cp)||cp>=0xd800&&cp<=0xdfff||cp===0xfffe||cp===0xffff)throw new Error('توجد محارف غير صالحة للتصدير. راجع النصوص وأزلها.');}}else if(Array.isArray(value))value.forEach(checkXML);else if(value&&typeof value==='object')Object.values(value).forEach(checkXML);}
 checkXML(cv);
 const arabic=textDirection(cv.fullName||cv.summary||cv.jobTitle)==='rtl';
 const labels=arabic?{summary:'الملخص المهني',skills:'المهارات',languages:'اللغات',experience:'الخبرة العملية',education:'التعليم',projects:'المشاريع',certifications:'الشهادات',present:'حتى الآن',gpa:'المعدل',tech:'التقنيات',location:'الموقع',native:'اللغة الأم',fluent:'بطلاقة',professional:'مهني',conversational:'متوسط',basic:'أساسي'}:{summary:'Profile',skills:'Skills',languages:'Languages',experience:'Experience',education:'Education',projects:'Projects',certifications:'Certifications',present:'Present',gpa:'GPA',tech:'Technologies',location:'Location',native:'Native',fluent:'Fluent',professional:'Professional',conversational:'Conversational',basic:'Basic'};
 const blocks:ExportBlock[]=[];
 const add=(kind:ExportBlock['kind'],text:string,dir?:'ltr'|'rtl')=>{if(text.trim())for(const line of text.replace(/\r\n?/g,'\n').split('\n'))blocks.push({kind,text:line,dir:dir||textDirection(line)});};
 const section=(label:string,has:boolean)=>{if(has)add('heading',label,arabic?'rtl':'ltr');};
 add('title',cv.fullName||(arabic?'السيرة الذاتية':'Resume'));add('subtitle',cv.jobTitle);
 add('meta',cv.email,'ltr');add('meta',cv.phone,'ltr');add('meta',cv.location);add('meta',cv.linkedin,'ltr');add('meta',cv.github,'ltr');add('meta',cv.portfolio,'ltr');
 section(labels.summary,!!cv.summary.trim());add('body',cv.summary);
 section(labels.skills,cv.skills.length>0);for(const skill of cv.skills){const level=cv.skillLevels?.find(item=>item.name===skill)?.level;add('body',skill+(level?' — '+level:''));}
 section(labels.languages,cv.languages.length>0);const levels:Record<string,string>={Native:labels.native,Fluent:labels.fluent,Professional:labels.professional,Conversational:labels.conversational,Basic:labels.basic};for(const item of cv.languages)add('body',item.lang+' — '+levels[item.level]);
 section(labels.experience,cv.experience.length>0);for(const item of cv.experience){add('subtitle',[item.role,item.company].filter(Boolean).join(' — '));add('meta',[item.startDate,item.current?labels.present:item.endDate].filter(Boolean).join(' – '));if(item.location)add('meta',labels.location+': '+item.location);add('body',item.description);if(item.tech.length)add('body',labels.tech+': '+item.tech.join(' · '));}
 section(labels.education,cv.education.length>0);for(const item of cv.education){add('subtitle',[item.degree,item.field,item.school].filter(Boolean).join(' — '));add('meta',[item.startDate,item.endDate].filter(Boolean).join(' – '));if(item.gpa)add('meta',labels.gpa+': '+item.gpa);add('body',item.description||'');}
 section(labels.projects,cv.projects.length>0);for(const item of cv.projects){add('subtitle',item.name);add('body',item.description);if(item.tech.length)add('body',labels.tech+': '+item.tech.join(' · '));add('meta',item.url,'ltr');add('meta',item.github,'ltr');}
 section(labels.certifications,cv.certifications.length>0);for(const item of cv.certifications){add('subtitle',item.name);add('meta',[item.issuer,item.date].filter(Boolean).join(' — '));add('meta',item.url,'ltr');}
 return blocks;
}
export const escapeExportText=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export function downloadCVBlob(blob:Blob,filename:string){
 const url=URL.createObjectURL(blob);const anchor=document.createElement('a');
 try{anchor.href=url;anchor.download=filename;anchor.style.display='none';document.body.appendChild(anchor);anchor.click();}
 finally{anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
export function printableCV(cv:CVData){
 const blocks=cvExportBlocks(cv);const content=blocks.map(block=>{const tag=block.kind==='title'?'h1':block.kind==='heading'?'h2':block.kind==='subtitle'?'h3':'p';return `<${tag} dir="${block.dir}" class="${block.kind}">${escapeExportText(block.text)||'&#160;'}</${tag}>`;}).join('');
 return `<!doctype html><html lang="${textDirection(cv.fullName||cv.summary)==='rtl'?'ar':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>${escapeExportText(cv.fullName||'CV')} — Resume</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}html,body{margin:0;background:white;color:#111;font-family:Arial,'DejaVu Sans',sans-serif;font-size:11pt;line-height:1.6}main{max-width:174mm;margin:auto;padding:10mm 0}h1,h2,h3,p{white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;text-align:start;unicode-bidi:plaintext;orphans:2;widows:2}h1{font-size:23pt;line-height:1.3;margin:0 0 6pt}h2{font-size:13pt;margin:18pt 0 6pt;border-bottom:1px solid #ccc;padding-bottom:3pt}h3{font-size:11.5pt;margin:10pt 0 3pt}h1,h2,h3{break-after:avoid;page-break-after:avoid}p{margin:3pt 0 6pt}.meta{font-size:10pt;color:#333}p,h3{max-width:100%}@media print{main{max-width:none;margin:0;padding:0}html,body{height:auto;width:auto}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}@media screen{main{padding:12mm;max-width:210mm}} </style></head><body><main>${content}</main></body></html>`;
}
