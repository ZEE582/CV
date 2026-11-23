import type {RunResult} from '../api/practiceClient';

export const maxExpectedOutput = 20000;
export type Comparison =
  | {state:'blocked';reason:string}
  | {state:'match'}
  | {state:'different';line:number;column:number;actual:string|null;expected:string|null};

export function compareOutput(result:RunResult,expected:string,ignoreFinalNewline:boolean,stale=false,pending=false):Comparison {
  if(pending)return {state:'blocked',reason:'انتظر انتهاء التشغيل قبل المقارنة.'};
  if(stale)return {state:'blocked',reason:'شغّل نسخة الكود والإدخال واللغة الحالية قبل المقارنة.'};
  if(result.state!=='completed'||result.phase!=='run'||result.exit_code!==0||result.signal||result.status)return {state:'blocked',reason:'المقارنة متاحة بعد اكتمال التشغيل بنجاح فقط.'};
  if(result.truncated)return {state:'blocked',reason:'المخرجات مختصرة؛ لا يمكن تأكيد مطابقة النص الكامل.'};
  if(typeof expected!=='string'||expected.length>maxExpectedOutput||typeof result.stdout!=='string'||result.stdout.length>maxExpectedOutput)return {state:'blocked',reason:'حد المقارنة 20000 حرف لكل نص.'};
  const normalize=(text:string)=>{const value=text.replace(/\r\n/g,'\n');return ignoreFinalNewline&&value.endsWith('\n')?value.slice(0,-1):value;};
  const actual=Array.from(normalize(result.stdout)),wanted=Array.from(normalize(expected));
  let line=1,column=1;
  for(let index=0;index<Math.max(actual.length,wanted.length);index++){
    if(actual[index]!==wanted[index])return {state:'different',line,column,actual:actual[index]??null,expected:wanted[index]??null};
    if(actual[index]==='\n'){line++;column=1;}else column++;
  }
  return {state:'match'};
}

export function outputCharacter(value:string|null){
  if(value===null)return 'نهاية النص';
  if(value===' ')return 'مسافة';
  if(value==='\t')return 'علامة Tab';
  if(value==='\n')return 'سطر جديد';
  if(value==='\r')return 'محرف رجوع \\r';
  return JSON.stringify(value);
}
