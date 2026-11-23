import {useState} from 'react';
import {Alert,Button,Checkbox,FormControlLabel} from '@mui/material';
import type {RunResult} from '../../api/practiceClient';
import {compareOutput,maxExpectedOutput,outputCharacter} from '../../utils/outputComparison';

export default function OutputComparison({result,stale,pending}:{result:RunResult;stale:boolean;pending:boolean}){
  const[expected,setExpected]=useState('');
  const[ignoreFinalNewline,setIgnoreFinalNewline]=useState(true);
  const[compared,setCompared]=useState(false);
  const comparison=compareOutput(result,expected,ignoreFinalNewline,stale,pending);
  return <details className="output-comparison"><summary>قارن بالمخرج الذي تتوقعه</summary>
    <p>تُقارن مخرجات stdout فقط بالنص الذي تدخله هنا، داخل الصفحة. المطابقة لا تثبت صحة حل المسألة ولا تمنح نقاطًا.</p>
    <label htmlFor="expected-output">المخرج المتوقع</label>
    <textarea id="expected-output" dir="ltr" rows={4} maxLength={maxExpectedOutput} value={expected} onChange={event=>{setExpected(event.target.value);setCompared(false);}} aria-describedby="expected-output-help" spellCheck={false} autoCapitalize="off" autoCorrect="off"/>
    <p id="expected-output-help" className="practice-muted">{expected.length} / {maxExpectedOutput} حرف. يمكن مقارنة نص فارغ. يُمسح النص المتوقع عند وصول نتيجة جديدة أو مغادرة الصفحة، ولا يُرسل لخدمة التنفيذ أو يُضمّن في ملف المسودات.</p>
    <FormControlLabel control={<Checkbox checked={ignoreFinalNewline} onChange={event=>{setIgnoreFinalNewline(event.target.checked);setCompared(false);}}/>} label="تجاهل سطر النهاية الواحد في كل نص"/>
    <p className="practice-muted">تُوحّد نهايات أسطر Windows وLinux دائمًا. تبقى المسافات وعلامات Tab وحالة الأحرف والأسطر الإضافية مؤثرة. موضع الاختلاف محسوب بالحروف، وتُحسب Tab حرفًا واحدًا.</p>
    <Button type="button" variant="outlined" disabled={comparison.state==='blocked'} onClick={()=>setCompared(true)}>قارن المخرج</Button>
    <div role="status" aria-live="polite" className="output-comparison-result">
      {comparison.state==='blocked'?<Alert severity="info">{comparison.reason}</Alert>:compared&&(comparison.state==='match'?<Alert severity="success">المخرج يطابق النص المتوقع وفق خيارات المقارنة.</Alert>:<Alert severity="warning"><p>المخرج يختلف عن النص المتوقع. أول اختلاف عند السطر {comparison.line}، الحرف {comparison.column}.</p><p>المستلم: <bdi>{outputCharacter(comparison.actual)}</bdi> · المتوقع: <bdi>{outputCharacter(comparison.expected)}</bdi></p></Alert>)}
    </div>
  </details>;
}
