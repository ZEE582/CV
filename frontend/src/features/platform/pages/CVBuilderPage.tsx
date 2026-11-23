import CVExportDialog from '../components/cv/CVExportDialog';
import {printableCV,exportFilename,downloadCVBlob} from '../components/cv/cv.export';
import {Alert} from '@mui/material';
import CVLeaveGuard from '../components/cv/CVLeaveGuard';
import type {CVClient} from '../api/cvClient';
import './CVBuilder.css';
/**
 * CVBuilderPage.tsx — refactored into components
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  type CVData, type Step,
  STEPS, AC, ACL, ACB,
  TEMPLATE_NAMES, TEMPLATE_COLORS,
} from '../components/cv/cv.types';
import CVPreview          from '../components/cv/CVTemplates';
import { Btn }            from '../components/cv/CVFormHelpers';
import { PersonalStep, SkillsStep, ExperienceStep, EducationStep, ProjectsStep, CertificationsStep } from '../components/cv/CVStepForms';
import PreviewStep        from '../components/cv/CVPreviewStep';
import { useAuth } from '../../../shared/AuthContext';
import useSavedCV from '../hooks/useSavedCV';
import CVStorageBar from '../components/cv/CVStorageBar';

export default function CVBuilderPage() {
  const {user,loading}=useAuth();
  if(loading) return <p role="status" style={{padding:32,textAlign:'center'}}>جارٍ التحقق من الحساب...</p>;
  return <CVEditor key={user?._id || 'guest'} accountId={user?._id} />;
}

export function CVEditor({accountId,client}:{accountId?:string;client?:CVClient}) {
  const [step, setStep]     = useState<Step>('intro');
  const storage=useSavedCV(accountId,client);
  const leaveGuard=<CVLeaveGuard dirty={storage.dirty} saving={storage.saving}/>;
  const {cv,setCV:setCv}=storage;
  const [skillInput, setSI] = useState('');
  const [exportHTML,setExportHTML]=useState<string|null>(null);const[exportError,setExportError]=useState('');const[exportMessage,setExportMessage]=useState('');const[wordBusy,setWordBusy]=useState(false);const exporting=useRef(false);const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);

  const update = useCallback(<K extends keyof CVData>(key: K, val: CVData[K]) => {
    setCv(p => ({ ...p, [key]: val }));
  }, [setCv]);

  const exportPDF=()=>{setExportError('');setExportMessage('');try{setExportHTML(printableCV(cv));}catch(error){setExportError(error instanceof Error?error.message:'تعذر تجهيز التصدير.');}};
  const exportWord=async()=>{
    if(exporting.current)return;exporting.current=true;setWordBusy(true);setExportError('');setExportMessage('');
    try{const snapshot=structuredClone(cv);const{wordBlob}=await import('../components/cv/cv.docx');const blob=await wordBlob(snapshot);if(!alive.current)return;downloadCVBlob(blob,exportFilename(snapshot.fullName,'docx'));setExportMessage('طُلب تنزيل ملف Word. تحقق من اكتمال التنزيل وافتح الملف على جهازك.');}
    catch(error){if(alive.current)setExportError(error instanceof Error?error.message:'تعذر تجهيز Word. بقيت بياناتك هنا.');}
    finally{exporting.current=false;if(alive.current)setWordBusy(false);}
  };
  const exportUI=<><CVExportDialog html={exportHTML} onClose={()=>setExportHTML(null)}/>{exportError&&<Alert severity="error">{exportError}</Alert>}{exportMessage&&<p role="status" dir="rtl">{exportMessage}</p>}</>;

  const stepIndex       = STEPS.findIndex(s => s.id === step);
  const currentStepMeta = STEPS.find(s => s.id === step);
  if(storage.loading || !storage.ready) return <div style={{maxWidth:900,margin:'auto',padding:24}}><CVStorageBar storage={storage} />{leaveGuard}{exportUI}</div>;

  // ── INTRO ──
  if (step === 'intro') return (
    <div className="cv-editor" style={{ maxWidth:900, margin:'0 auto', padding:'clamp(24px,4vw,48px) clamp(16px,4vw,40px)', direction:'ltr' }}>
      <CVStorageBar storage={storage} />{leaveGuard}{exportUI}
      <div style={{ background:'linear-gradient(135deg,rgba(107,95,230,0.08),rgba(168,156,247,0.05))', border:`1px solid ${ACB}`, borderRadius:20, padding:'clamp(28px,5vw,52px)', marginBottom:32, textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(107,95,230,0.07)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
          <h1 style={{ fontFamily:"'Segoe UI',sans-serif", fontSize:'clamp(22px,4vw,34px)', fontWeight:900, color:'#1a1a2e', margin:'0 0 8px', letterSpacing:-1 }}>Professional CV Builder</h1>
          <p style={{ fontFamily:"'Tajawal',sans-serif", fontSize:18, color:AC, fontWeight:700, margin:'0 0 12px' }}>منشئ السيرة الذاتية الاحترافية</p>
          <p style={{ fontFamily:"'Segoe UI',sans-serif", fontSize:14, color:'#555577', lineHeight:1.7, maxWidth:560, margin:'0 auto 14px' }}>
            Build and review your resume with templates for software engineers, CS graduates and IT professionals.
          </p>
          <p style={{ fontFamily:"'Tajawal',sans-serif", fontSize:13, color:'#8080aa', lineHeight:1.7, maxWidth:500, margin:'0 auto 28px' }}>
            أنشئ سيرتك الذاتية الاحترافية في دقائق مع 10 قوالب مختلفة وتصدير PDF و Word مباشرةً
          </p>
          <button onClick={()=>setStep('personal')} style={{ background:AC, color:'#fff', border:'none', borderRadius:12, padding:'14px 36px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Segoe UI',sans-serif", boxShadow:`0 4px 20px rgba(107,95,230,0.35)` }}>
            🚀 Start Building Your CV / ابدأ الآن
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:28 }}>
        {[['🎨','10 Templates','١٠ قوالب احترافية'],['📥','PDF & Word Export','تصدير مباشر'],['🔄','Redesign Anytime','إعادة التصميم'],['👁','Live Preview','معاينة قبل التصدير'],['💼','Built for Devs','مخصص للمبرمجين'],['🌍','Bilingual Guide','أسئلة عربي وإنجليزي']].map(([ic,en,ar])=>(
          <div key={en} style={{ background:'rgba(255,255,255,0.8)', borderRadius:12, padding:'18px 14px', textAlign:'center', border:`1px solid ${ACB}` }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
            <div style={{ fontFamily:"'Segoe UI',sans-serif", fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{en}</div>
            <div style={{ fontFamily:"'Tajawal',sans-serif", fontSize:11, color:'#8080aa', marginTop:2 }}>{ar}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(255,255,255,0.7)', borderRadius:14, padding:22, border:`1px solid ${ACB}` }}>
        <div style={{ fontFamily:"'Segoe UI',sans-serif", fontWeight:800, fontSize:14, color:'#1a1a2e', marginBottom:4 }}>10 Professional Templates</div>
        <div style={{ fontFamily:"'Tajawal',sans-serif", fontSize:12, color:'#8080aa', marginBottom:14 }}>١٠ قوالب احترافية متنوعة الأنماط والأساليب</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {TEMPLATE_NAMES.map((name,i)=>(
            <span key={i} style={{ padding:'4px 11px', borderRadius:7, fontSize:11, fontFamily:"'Segoe UI',sans-serif", background:`${TEMPLATE_COLORS[i]}15`, color:TEMPLATE_COLORS[i], border:`1px solid ${TEMPLATE_COLORS[i]}30`, fontWeight:600 }}>
              {i+1}. {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── STEP WRAPPER ──
  return (
    <div className="cv-editor" style={{ maxWidth:1200, margin:'0 auto', padding:'clamp(14px,3vw,26px) clamp(12px,4vw,30px)', direction:'ltr' }}>
      <CVStorageBar storage={storage} />{leaveGuard}{exportUI}
      {/* Progress bar */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', gap:4, marginBottom:9, overflowX:'auto', paddingBottom:4 }}>
          {STEPS.map((s,i)=>(
            <button key={s.id} onClick={()=>setStep(s.id)} style={{
              padding:'5px 11px', borderRadius:7, fontSize:11, whiteSpace:'nowrap',
              background: s.id===step ? AC : i<stepIndex ? ACL : 'rgba(0,0,0,0.04)',
              color:       s.id===step ? '#fff' : i<stepIndex ? AC : '#9090bb',
              border:      s.id===step ? `1px solid ${AC}` : i<stepIndex ? ACB : '1px solid rgba(0,0,0,0.08)',
              fontFamily:"'Segoe UI',sans-serif", fontWeight: s.id===step?700:500, cursor:'pointer',
            }}>{s.icon} {s.labelEn}</button>
          ))}
        </div>
        <div style={{ background:'#f0eeff', borderRadius:99, height:4 }}>
          <div style={{ background:AC, borderRadius:99, height:'100%', width:`${((stepIndex+1)/STEPS.length)*100}%`, transition:'width 0.3s' }} />
        </div>
      </div>

      <div className="cv-editor-layout" style={{ display:'flex', gap:22, alignItems:'flex-start' }}>
        {/* FORM */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:'rgba(255,255,255,0.88)', borderRadius:16, padding:'22px 20px', border:`1px solid ${ACB}`, boxShadow:`0 4px 24px rgba(107,95,230,0.08)` }}>
            <div style={{ fontFamily:"'Segoe UI',sans-serif", fontWeight:800, fontSize:17, color:'#1a1a2e', marginBottom:2 }}>
              {currentStepMeta?.icon} {currentStepMeta?.labelEn}
            </div>
            <div style={{ fontFamily:"'Tajawal',sans-serif", fontSize:14, color:'#8080aa', marginBottom:18 }}>
              {currentStepMeta?.labelAr}
            </div>

            {step === 'personal'       && <PersonalStep       cv={cv} update={update} />}
            {step === 'skills'         && <SkillsStep         cv={cv} update={update} skillInput={skillInput} setSI={setSI} />}
            {step === 'experience'     && <ExperienceStep     cv={cv} update={update} />}
            {step === 'education'      && <EducationStep      cv={cv} update={update} />}
            {step === 'projects'       && <ProjectsStep       cv={cv} update={update} />}
            {step === 'certifications' && <CertificationsStep cv={cv} update={update} />}
            {step === 'preview'        && <PreviewStep        cv={cv} update={update} onExportPDF={exportPDF} onExportWord={()=>void exportWord()} exporting={wordBusy} />}

            {/* Navigation */}
            <div style={{ display:'flex', gap:10, marginTop:18, paddingTop:14, borderTop:`1px solid ${ACB}` }}>
              {stepIndex>0 && <Btn variant="ghost" onClick={()=>setStep(STEPS[stepIndex-1].id)}>← Back / رجوع</Btn>}
              {step!=='preview' && <Btn onClick={()=>setStep(STEPS[stepIndex+1].id)}>Next / التالي →</Btn>}
              {<Btn variant="ghost" onClick={()=>setStep('preview')}>✨ Preview CV</Btn>}
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW PANEL */}
        <div style={{ width:460, flexShrink:0, position:'sticky', top:80 }} className={'cv-preview-sticky'+(step==='preview'?' cv-preview-active':'')}>
          <div style={{ fontFamily:"'Segoe UI',sans-serif", fontSize:11, color:'#8080aa', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
            <span>👁 Live Preview / معاينة مباشرة</span>
            <span style={{ background:ACL, color:AC, padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600 }}>
              Template {cv.templateId}
            </span>
          </div>
          <p className="cv-preview-hint" dir="rtl">هذه معاينة سيرتك. مرّر داخلها أفقيًا وعموديًا لرؤية المحتوى كاملًا.</p><div className="cv-preview-frame" role="region" aria-label="معاينة السيرة الذاتية" tabIndex={0} style={{ background:'#fff', borderRadius:12, border:`1px solid ${ACB}`, boxShadow:`0 8px 32px rgba(107,95,230,0.12)`, overflow:'auto', maxHeight:680 }}>
            <div className="cv-preview-document" style={{ width:'100%', minHeight:500 }}>
              <CVPreview cv={cv} />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
