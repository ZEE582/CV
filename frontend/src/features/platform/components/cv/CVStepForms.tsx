import React from 'react';
import type { CVData } from './cv.types';
import { AC, ACL, ACB, SKILL_TAGS, LANG_LEVELS, uid } from './cv.types';
import { Field, Btn } from './CVFormHelpers';

// ─── Personal Step ────────────────────────────────────────────────────────────
export function PersonalStep({ cv, update }: { cv: CVData; update: <K extends keyof CVData>(key: K, val: CVData[K]) => void }) {
  return <>
    <Field label="Full Name" labelAr="الاسم الكامل" value={cv.fullName} onChange={v=>update('fullName',v)} placeholder="Ahmad Al-Rashid" />
    <Field label="Job Title / Target Role" labelAr="المسمى الوظيفي المستهدف" value={cv.jobTitle} onChange={v=>update('jobTitle',v)} placeholder="Full-Stack Developer" />
    <Field label="Email Address" labelAr="البريد الإلكتروني" value={cv.email} onChange={v=>update('email',v)} placeholder="ahmad@example.com" type="email" />
    <Field label="Phone Number" labelAr="رقم الهاتف" value={cv.phone} onChange={v=>update('phone',v)} placeholder="+970 59 123 4567" />
    <Field label="Location / City" labelAr="المدينة / الموقع" value={cv.location} onChange={v=>update('location',v)} placeholder="Ramallah, Palestine" />
    <Field label="LinkedIn Profile URL" labelAr="رابط LinkedIn" value={cv.linkedin} onChange={v=>update('linkedin',v)} placeholder="linkedin.com/in/username" />
    <Field label="GitHub Profile URL" labelAr="رابط GitHub" value={cv.github} onChange={v=>update('github',v)} placeholder="github.com/username" />
    <Field label="Portfolio / Website" labelAr="الموقع الشخصي" value={cv.portfolio} onChange={v=>update('portfolio',v)} placeholder="myportfolio.com" />
    <Field label="Professional Summary" labelAr="الملخص المهني — مقدمة قوية عنك" value={cv.summary} onChange={v=>update('summary',v)}
      placeholder="Passionate full-stack developer with 3+ years building scalable web applications..." rows={4} />
  </>;
}

// ─── Skills Step ──────────────────────────────────────────────────────────────
export function SkillsStep({ cv, update, skillInput, setSI }: {
  cv: CVData;
  update: <K extends keyof CVData>(key: K, val: CVData[K]) => void;
  skillInput: string;
  setSI: (v: string) => void;
}) {
  return <>
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555577', marginBottom:6 }}>
        Technical Skills / <span style={{ color:'#9090bb', fontWeight:400 }}>المهارات التقنية</span>
      </label>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <input value={skillInput} onChange={e=>setSI(e.target.value)}
          onKeyDown={e=>{ if (e.key==='Enter'&&skillInput.trim()) { update('skills',[...cv.skills,skillInput.trim()]); setSI(''); }}}
          placeholder="Type skill and press Enter..."
          style={{ flex:1, padding:'9px 12px', borderRadius:8, border:`1px solid ${ACB}`, fontSize:13, outline:'none', fontFamily:"'Segoe UI',sans-serif" }} />
        <Btn small onClick={()=>{ if(skillInput.trim()){ update('skills',[...cv.skills,skillInput.trim()]); setSI(''); }}}>+ Add</Btn>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {cv.skills.map(s=>(
          <span key={s} style={{ background:ACL, color:AC, borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:4, border:ACB }}>
            {s}<button onClick={()=>update('skills',cv.skills.filter(x=>x!==s))} style={{ background:'none', border:'none', cursor:'pointer', color:AC, fontWeight:900, fontSize:14, lineHeight:1 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ fontSize:10, color:'#8080aa', marginBottom:5 }}>Quick add / إضافة سريعة:</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {SKILL_TAGS.filter(s=>!cv.skills.includes(s)).slice(0,24).map(s=>(
          <span key={s} onClick={()=>update('skills',[...cv.skills,s])} style={{ background:'#f5f4ff', border:'1px solid #e0dcff', color:AC, borderRadius:5, padding:'2px 8px', fontSize:10, cursor:'pointer' }}>+ {s}</span>
        ))}
      </div>
    </div>
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555577', marginBottom:7 }}>
        Languages / <span style={{ color:'#9090bb', fontWeight:400 }}>اللغات</span>
      </label>
      {cv.languages.map((lang,i)=>(
        <div key={i} style={{ display:'flex', gap:7, marginBottom:7, alignItems:'center' }}>
          <input value={lang.lang} placeholder="Language" onChange={e=>{ const a=[...cv.languages]; a[i]={...a[i],lang:e.target.value}; update('languages',a); }} style={{ flex:2, padding:'7px 10px', borderRadius:7, border:`1px solid ${ACB}`, fontSize:12, outline:'none', fontFamily:'inherit' }} />
          <select value={lang.level} onChange={e=>{ const a=[...cv.languages]; a[i]={...a[i],level:e.target.value}; update('languages',a); }} style={{ flex:1, padding:'7px 8px', borderRadius:7, border:`1px solid ${ACB}`, fontSize:12, outline:'none', background:'#fff' }}>
            {LANG_LEVELS.map(l=><option key={l}>{l}</option>)}
          </select>
          <button onClick={()=>update('languages',cv.languages.filter((_,j)=>j!==i))} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'5px 9px', cursor:'pointer', fontSize:14, fontWeight:700 }}>×</button>
        </div>
      ))}
      <Btn small variant="ghost" onClick={()=>update('languages',[...cv.languages,{ lang:'', level:'Professional' }])}>+ Add Language</Btn>
    </div>
  </>;
}

// ─── Experience Step ──────────────────────────────────────────────────────────
export function ExperienceStep({ cv, update }: { cv: CVData; update: <K extends keyof CVData>(key: K, val: CVData[K]) => void }) {
  return <>
    {cv.experience.map((exp,i)=>(
      <div key={exp.id} style={{ background:'#f8f9ff', borderRadius:10, padding:'16px 14px', marginBottom:14, border:`1px solid ${ACB}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13, color:AC }}>Position #{i+1}</div>
          <button onClick={()=>update('experience',cv.experience.filter(e=>e.id!==exp.id))} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Remove</button>
        </div>
        <Field label="Job Role / Title" labelAr="المسمى الوظيفي" value={exp.role} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],role:v}; update('experience',a); }} placeholder="Frontend Developer" />
        <Field label="Company Name" labelAr="اسم الشركة" value={exp.company} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],company:v}; update('experience',a); }} placeholder="Tech Corp Ltd." />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}><Field label="Start Date" labelAr="تاريخ البداية" value={exp.startDate} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],startDate:v}; update('experience',a); }} placeholder="Jan 2022" /></div>
          <div style={{ flex:1 }}><Field label="End Date" labelAr="تاريخ الانتهاء" value={exp.endDate} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],endDate:v}; update('experience',a); }} placeholder="Dec 2023" /></div>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#555577', marginBottom:10, cursor:'pointer' }}>
          <input type="checkbox" checked={exp.current} onChange={e=>{ const a=[...cv.experience]; a[i]={...a[i],current:e.target.checked}; update('experience',a); }} />
          Currently working here / أعمل هنا حالياً
        </label>
        <Field label="Job Description & Achievements" labelAr="وصف المهام والإنجازات" value={exp.description} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],description:v}; update('experience',a); }} placeholder="• Developed React applications serving 50k+ users&#10;• Reduced load time by 40%" rows={4} />
        <Field label="Technologies Used" labelAr="التقنيات المستخدمة (افصل بفاصلة)" value={exp.tech.join(', ')} onChange={v=>{ const a=[...cv.experience]; a[i]={...a[i],tech:v.split(',').map(t=>t.trim()).filter(Boolean)}; update('experience',a); }} placeholder="React, TypeScript, Node.js, PostgreSQL" />
      </div>
    ))}
    <Btn variant="ghost" onClick={()=>update('experience',[...cv.experience,{ id:uid(), company:'', role:'', startDate:'', endDate:'', current:false, description:'', tech:[] }])}>+ Add Work Experience / أضف خبرة عمل</Btn>
  </>;
}

// ─── Education Step ───────────────────────────────────────────────────────────
export function EducationStep({ cv, update }: { cv: CVData; update: <K extends keyof CVData>(key: K, val: CVData[K]) => void }) {
  return <>
    {cv.education.map((edu,i)=>(
      <div key={edu.id} style={{ background:'#f8f9ff', borderRadius:10, padding:'16px 14px', marginBottom:14, border:`1px solid ${ACB}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13, color:AC }}>Degree #{i+1}</div>
          <button onClick={()=>update('education',cv.education.filter(e=>e.id!==edu.id))} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Remove</button>
        </div>
        <Field label="University / School Name" labelAr="اسم الجامعة" value={edu.school} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],school:v}; update('education',a); }} placeholder="Birzeit University" />
        <Field label="Degree Type" labelAr="نوع الشهادة" value={edu.degree} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],degree:v}; update('education',a); }} placeholder="Bachelor of Science" />
        <Field label="Field of Study" labelAr="التخصص" value={edu.field} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],field:v}; update('education',a); }} placeholder="Computer Science" />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}><Field label="Start Year" labelAr="سنة البداية" value={edu.startDate} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],startDate:v}; update('education',a); }} placeholder="2018" /></div>
          <div style={{ flex:1 }}><Field label="End Year" labelAr="سنة التخرج" value={edu.endDate} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],endDate:v}; update('education',a); }} placeholder="2022" /></div>
          <div style={{ flex:1 }}><Field label="GPA (optional)" labelAr="المعدل" value={edu.gpa} onChange={v=>{ const a=[...cv.education]; a[i]={...a[i],gpa:v}; update('education',a); }} placeholder="3.7 / 4.0" /></div>
        </div>
      </div>
    ))}
    <Btn variant="ghost" onClick={()=>update('education',[...cv.education,{ id:uid(), school:'', degree:'', field:'', startDate:'', endDate:'', gpa:'' }])}>+ Add Education / أضف تعليم</Btn>
  </>;
}

// ─── Projects Step ────────────────────────────────────────────────────────────
export function ProjectsStep({ cv, update }: { cv: CVData; update: <K extends keyof CVData>(key: K, val: CVData[K]) => void }) {
  return <>
    {cv.projects.map((proj,i)=>(
      <div key={proj.id} style={{ background:'#f8f9ff', borderRadius:10, padding:'16px 14px', marginBottom:14, border:`1px solid ${ACB}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13, color:AC }}>Project #{i+1}</div>
          <button onClick={()=>update('projects',cv.projects.filter(p=>p.id!==proj.id))} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Remove</button>
        </div>
        <Field label="Project Name" labelAr="اسم المشروع" value={proj.name} onChange={v=>{ const a=[...cv.projects]; a[i]={...a[i],name:v}; update('projects',a); }} placeholder="E-Commerce Platform" />
        <Field label="Project Description" labelAr="وصف المشروع" value={proj.description} onChange={v=>{ const a=[...cv.projects]; a[i]={...a[i],description:v}; update('projects',a); }} placeholder="Built a full-stack e-commerce platform..." rows={3} />
        <Field label="Technologies Used" labelAr="التقنيات المستخدمة" value={proj.tech.join(', ')} onChange={v=>{ const a=[...cv.projects]; a[i]={...a[i],tech:v.split(',').map(t=>t.trim()).filter(Boolean)}; update('projects',a); }} placeholder="React, Node.js, MongoDB" />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}><Field label="Live URL" labelAr="رابط المشروع" value={proj.url} onChange={v=>{ const a=[...cv.projects]; a[i]={...a[i],url:v}; update('projects',a); }} placeholder="https://myproject.com" /></div>
          <div style={{ flex:1 }}><Field label="GitHub URL" labelAr="رابط GitHub" value={proj.github} onChange={v=>{ const a=[...cv.projects]; a[i]={...a[i],github:v}; update('projects',a); }} placeholder="github.com/user/repo" /></div>
        </div>
      </div>
    ))}
    <Btn variant="ghost" onClick={()=>update('projects',[...cv.projects,{ id:uid(), name:'', description:'', tech:[], url:'', github:'' }])}>+ Add Project / أضف مشروع</Btn>
  </>;
}

// ─── Certifications Step ──────────────────────────────────────────────────────
export function CertificationsStep({ cv, update }: { cv: CVData; update: <K extends keyof CVData>(key: K, val: CVData[K]) => void }) {
  return <>
    {cv.certifications.map((cert,i)=>(
      <div key={cert.id} style={{ background:'#f8f9ff', borderRadius:10, padding:'16px 14px', marginBottom:14, border:`1px solid ${ACB}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13, color:AC }}>Certification #{i+1}</div>
          <button onClick={()=>update('certifications',cv.certifications.filter(c=>c.id!==cert.id))} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>Remove</button>
        </div>
        <Field label="Certification Name" labelAr="اسم الشهادة" value={cert.name} onChange={v=>{ const a=[...cv.certifications]; a[i]={...a[i],name:v}; update('certifications',a); }} placeholder="AWS Certified Solutions Architect" />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:2 }}><Field label="Issuing Organization" labelAr="الجهة المانحة" value={cert.issuer} onChange={v=>{ const a=[...cv.certifications]; a[i]={...a[i],issuer:v}; update('certifications',a); }} placeholder="Amazon Web Services" /></div>
          <div style={{ flex:1 }}><Field label="Date Earned" labelAr="تاريخ الحصول" value={cert.date} onChange={v=>{ const a=[...cv.certifications]; a[i]={...a[i],date:v}; update('certifications',a); }} placeholder="2023" /></div>
        </div>
        <Field label="Credential URL (optional)" labelAr="رابط الشهادة" value={cert.url} onChange={v=>{ const a=[...cv.certifications]; a[i]={...a[i],url:v}; update('certifications',a); }} placeholder="https://www.credly.com/..." />
      </div>
    ))}
    <Btn variant="ghost" onClick={()=>update('certifications',[...cv.certifications,{ id:uid(), name:'', issuer:'', date:'', url:'' }])}>+ Add Certification / أضف شهادة</Btn>
  </>;
}
