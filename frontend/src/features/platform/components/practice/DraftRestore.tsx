import {useEffect,useRef,useState,type ChangeEvent} from 'react';
import {Alert,Button,Dialog,DialogActions,DialogContent,DialogTitle} from '@mui/material';
import {codeLanguages,type CodeLanguage} from '../../utils/practice';
import {readDraftFile,type ImportedDrafts} from '../../utils/practiceDraftImport';

interface Props {
  busy:boolean;blocked:boolean;problemId:string|null;
  onBegin:()=>void;onPending:(pending:boolean)=>void;onRestore:(drafts:ImportedDrafts)=>void;
  onBackup:()=>void;backupMessage:string;backupError:string;
}
export default function DraftRestore({busy,blocked,problemId,onBegin,onPending,onRestore,onBackup,backupMessage,backupError}:Props){
  const [reading,setReading]=useState(false);
  const [failure,setFailure]=useState('');
  const [candidate,setCandidate]=useState<{name:string;bundle:ImportedDrafts}|null>(null);
  const request=useRef(0);
  useEffect(()=>()=>{request.current++;},[]);
  async function choose(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];event.currentTarget.value='';
    if(!file||busy||blocked)return;
    const ticket=++request.current;setFailure('');setCandidate(null);setReading(true);onBegin();onPending(true);
    try{
      const bundle=await readDraftFile(file);
      if(request.current===ticket)setCandidate({name:file.name.slice(0,200),bundle});
    }catch(error){
      if(request.current===ticket){setFailure(error instanceof Error?error.message:'تعذر قراءة الملف. بقيت مسوداتك كما هي.');onPending(false);}
    }finally{if(request.current===ticket)setReading(false);}
  }
  function cancel(){setCandidate(null);onPending(false);}
  const languages=candidate?Object.keys(candidate.bundle.drafts) as CodeLanguage[]:[];
  return <section className="draft-restore" aria-label="استرجاع المسودات">
    <details><summary>استرجاع نسخة محفوظة</summary>
    <p className="practice-muted">اختر ملف المسودات JSON، حتى 2 ميغابايت. يُقرأ على جهازك فقط، ولا يُرفع إلى الخادم أو يُشغّل الكود.</p>
    <label htmlFor="draft-file">ملف المسودات</label>
    <input id="draft-file" type="file" accept=".json,application/json" disabled={busy||blocked||reading||candidate!==null} onChange={event=>void choose(event)}/>
    {reading&&<p role="status">جارٍ قراءة النسخة والتحقق منها…</p>}
    {failure&&<Alert severity="error">{failure}</Alert>}
    </details>
    <Dialog open={candidate!==null&&!blocked} onClose={cancel} fullWidth maxWidth="sm" aria-labelledby="draft-restore-title" PaperProps={{dir:'rtl',sx:{m:2,width:'calc(100% - 32px)',fontFamily:"'Tajawal',sans-serif",'& .MuiTypography-root,& .MuiButton-root':{fontFamily:'inherit',fontSize:15}}}}>
      <DialogTitle id="draft-restore-title">استرجاع المسودات من الملف؟</DialogTitle>
      <DialogContent className="draft-import-content">
        {candidate&&<>
          <p className="draft-file-name" dir="auto">{candidate.name}</p>
          <p>سيُستبدل الكود والإدخال للغات التالية فقط. تبقى مسودات اللغات الأخرى كما هي.</p>
          <ul>{languages.map(language=><li key={language}>{codeLanguages[language]}: {candidate.bundle.drafts[language]!.code.length} حرف كود، {candidate.bundle.drafts[language]!.stdin.length} حرف إدخال</li>)}</ul>
          <p>اللغة التي ستُفتح: {codeLanguages[candidate.bundle.activeLanguage]}.</p>
          <p>يبقى التدريب المفتوح كما هو. الاسترجاع لا يشغّل الكود ولا يحفظه في حسابك.</p>
          {candidate.bundle.problemId!==problemId&&<Alert severity="info">النسخة تخص {candidate.bundle.problemId?<span>معرّف المسألة <bdi>{candidate.bundle.problemId}</bdi></span>:'محررًا دون مسألة مرتبطة'}؛ لن يتغير سياق التدريب الحالي.</Alert>}
          <details><summary>معاينة كود {codeLanguages[candidate.bundle.activeLanguage]}</summary><pre className="draft-import-preview" dir="ltr">{candidate.bundle.drafts[candidate.bundle.activeLanguage]!.code.slice(0,1200)||'(الكود فارغ)'}</pre>{candidate.bundle.drafts[candidate.bundle.activeLanguage]!.code.length>1200&&<p>تُعرض أول 1200 حرف للمعاينة فقط.</p>}</details>
        </>}
        {backupMessage&&<p role="status">{backupMessage}</p>}{backupError&&<Alert severity="error">{backupError}</Alert>}
      </DialogContent>
      <DialogActions sx={{flexWrap:'wrap',gap:1}}>
        <Button color="inherit" onClick={cancel}>الاحتفاظ بالمسودات الحالية</Button>
        <Button onClick={onBackup}>تنزيل نسخة حالية</Button>
        <Button disabled={busy||reading||!candidate} onClick={()=>{if(!candidate||busy)return;onRestore(candidate.bundle);cancel();}}>استرجاع المسودات</Button>
      </DialogActions>
    </Dialog>
  </section>;
}
