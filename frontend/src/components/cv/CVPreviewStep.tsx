import React from 'react';
import type { CVData } from './cv.types';
import { AC, ACL, ACB, TEMPLATE_NAMES, TEMPLATE_COLORS } from './cv.types';

interface Props {
  cv: CVData;
  update: <K extends keyof CVData>(key: K, val: CVData[K]) => void;
  onExportPDF: () => void;
  onExportWord: () => void;
}

export default function PreviewStep({ cv, update, onExportPDF, onExportWord }: Props) {
  return <>
    {/* Template selector */}
    <div style={{ marginBottom:18 }}>
      <div style={{ fontWeight:700, fontSize:13, color:'#1a1a2e', marginBottom:4 }}>Choose Template / اختر القالب</div>
      <div style={{ fontSize:11, color:'#8080aa', marginBottom:10 }}>Don't like the design? Click another to switch instantly / لا يعجبك؟ اضغط على قالب آخر</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {TEMPLATE_NAMES.map((name,i)=>(
          <button key={i} onClick={()=>{ update('templateId',i+1); update('accentColor',TEMPLATE_COLORS[i]); }} style={{
            padding:'5px 13px', borderRadius:8, fontSize:11, fontFamily:'inherit',
            background: cv.templateId===i+1 ? TEMPLATE_COLORS[i] : `${TEMPLATE_COLORS[i]}15`,
            color:      cv.templateId===i+1 ? '#fff' : TEMPLATE_COLORS[i],
            border:`1.5px solid ${cv.templateId===i+1?TEMPLATE_COLORS[i]:`${TEMPLATE_COLORS[i]}40`}`,
            fontWeight: cv.templateId===i+1?700:500, cursor:'pointer',
          }}>{i+1}. {name}</button>
        ))}
      </div>
    </div>

    {/* Redesign */}
    <div style={{ padding:'12px 16px', background:ACL, borderRadius:10, border:ACB, marginBottom:16 }}>
      <div style={{ fontWeight:700, fontSize:12, color:AC, marginBottom:4 }}>🔄 Don't like the look? / لا يعجبك الشكل؟</div>
      <div style={{ fontSize:11, color:'#7777aa', marginBottom:10 }}>Cycle through all 10 templates / انتقل بين القوالب العشرة للعثور على التصميم المثالي</div>
      <button onClick={()=>{ const next=(cv.templateId%10)+1; update('templateId',next); update('accentColor',TEMPLATE_COLORS[next-1]); }} style={{ background:ACL, color:AC, border:ACB, borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Segoe UI',sans-serif" }}>
        🔄 Next Template / القالب التالي
      </button>
    </div>

    {/* Export */}
    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
      <button onClick={onExportPDF} style={{ background:AC, color:'#fff', border:'none', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 3px 12px rgba(107,95,230,0.3)` }}>
        📥 Export PDF / حمّل PDF
      </button>
      <button onClick={onExportWord} style={{ background:'#0ea5e9', color:'#fff', border:'none', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 12px rgba(14,165,233,0.3)' }}>
        📄 Export Word / حمّل Word
      </button>
    </div>
  </>;
}
