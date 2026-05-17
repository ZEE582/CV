import React from 'react';
import type { CVData } from './cv.types';

// ─── Shared sub-components ────────────────────────────────────────────────────
function SBsec({ title, children }: { title:string; children:React.ReactNode }) {
  return <div style={{ marginBottom:18 }}><div style={{ fontSize:9, fontWeight:700, letterSpacing:2, opacity:0.6, borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:3, marginBottom:7 }}>{title}</div>{children}</div>;
}
function SBrow({ icon, val }: { icon:string; val:string }) {
  return <div style={{ display:'flex', gap:5, alignItems:'flex-start', marginBottom:5, fontSize:10, opacity:0.9 }}><span style={{ flexShrink:0 }}>{icon}</span><span style={{ wordBreak:'break-all' }}>{val}</span></div>;
}
function MSec({ title, c, children }: { title:string; c:string; children:React.ReactNode }) {
  return <div style={{ marginBottom:22 }}><div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:4, marginBottom:12 }}>{title}</div>{children}</div>;
}
function T2sec({ c, title }: { c:string; title:string }) {
  return <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:c, borderBottom:`1px solid ${c}40`, paddingBottom:4, marginBottom:10, marginTop:18 }}>{title}</div>;
}
function T3sec({ c, title }: { c:string; title:string }) {
  return <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:5, marginBottom:10, marginTop:18 }}>{title}</div>;
}
function ElegDiv({ c, title }: { c:string; title:string }) {
  return <div style={{ textAlign:'center', margin:'20px 0 12px' }}><div style={{ display:'flex', alignItems:'center', gap:12 }}><div style={{ flex:1, height:1, background:'#ddd' }} /><div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:c }}>{title.toUpperCase()}</div><div style={{ flex:1, height:1, background:'#ddd' }} /></div></div>;
}
function T8lbl({ c, t }: { c:string; t:string }) {
  return <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}30`, paddingBottom:5, marginBottom:12, marginTop:18 }}>{t.toUpperCase()}</div>;
}
function T9lbl({ c, t }: { c:string; t:string }) {
  return <div style={{ fontSize:10.5, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:4, marginBottom:12, marginTop:18 }}>{t}</div>;
}

// ─── T1 Purple Sidebar ────────────────────────────────────────────────────────
function T1({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ display:'flex', minHeight:'100%', fontFamily:"'Segoe UI',sans-serif", fontSize:13, color:'#1a1a2e' }}>
      <div style={{ width:220, background:c, color:'#fff', padding:'32px 20px', flexShrink:0 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, marginBottom:14 }}>
          {cv.fullName?cv.fullName[0].toUpperCase():'?'}
        </div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{cv.fullName||'Your Name'}</div>
        <div style={{ fontSize:11, opacity:0.8, marginBottom:20 }}>{cv.jobTitle||'Software Engineer'}</div>
        <SBsec title="CONTACT">
          {cv.email    && <SBrow icon="✉" val={cv.email} />}
          {cv.phone    && <SBrow icon="📱" val={cv.phone} />}
          {cv.location && <SBrow icon="📍" val={cv.location} />}
          {cv.linkedin && <SBrow icon="in" val={cv.linkedin} />}
          {cv.github   && <SBrow icon="⌥" val={cv.github} />}
        </SBsec>
        {cv.skills.length>0 && <SBsec title="SKILLS"><div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{cv.skills.map(s=><span key={s} style={{ background:'rgba(255,255,255,0.18)', borderRadius:4, padding:'2px 7px', fontSize:10 }}>{s}</span>)}</div></SBsec>}
        {cv.languages.length>0 && <SBsec title="LANGUAGES">{cv.languages.map((l,i)=><div key={i} style={{ marginBottom:4 }}><div style={{ fontSize:11, fontWeight:600 }}>{l.lang}</div><div style={{ fontSize:10, opacity:0.7 }}>{l.level}</div></div>)}</SBsec>}
      </div>
      <div style={{ flex:1, padding:'32px 28px' }}>
        {cv.summary && <MSec title="PROFILE" c={c}><p style={{ margin:0, lineHeight:1.6 }}>{cv.summary}</p></MSec>}
        {cv.experience.length>0 && <MSec title="EXPERIENCE" c={c}>{cv.experience.map(e=><div key={e.id} style={{ marginBottom:16 }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ color:c, fontSize:12 }}>{e.company}</div></div><div style={{ fontSize:11, color:'#666' }}>{e.startDate}–{e.current?'Present':e.endDate}</div></div>{e.description&&<p style={{ margin:'4px 0', fontSize:12, lineHeight:1.6, color:'#444' }}>{e.description}</p>}{e.tech.length>0&&<div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{e.tech.map(t=><span key={t} style={{ background:`${c}15`, color:c, borderRadius:4, padding:'1px 6px', fontSize:10 }}>{t}</span>)}</div>}</div>)}</MSec>}
        {cv.projects.length>0 && <MSec title="PROJECTS" c={c}>{cv.projects.map(p=><div key={p.id} style={{ marginBottom:12 }}><div style={{ fontWeight:700 }}>{p.name}</div>{p.description&&<p style={{ margin:'3px 0', fontSize:12, lineHeight:1.5, color:'#444' }}>{p.description}</p>}{p.tech.length>0&&<div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>{p.tech.map(t=><span key={t} style={{ background:`${c}15`, color:c, borderRadius:4, padding:'1px 6px', fontSize:10 }}>{t}</span>)}</div>}</div>)}</MSec>}
        {cv.education.length>0 && <MSec title="EDUCATION" c={c}>{cv.education.map(e=><div key={e.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700 }}>{e.degree} in {e.field}</div><div style={{ color:c, fontSize:12 }}>{e.school}</div><div style={{ fontSize:11, color:'#666' }}>{e.startDate}–{e.endDate}{e.gpa?` · GPA: ${e.gpa}`:''}</div></div>)}</MSec>}
        {cv.certifications.length>0 && <MSec title="CERTIFICATIONS" c={c}>{cv.certifications.map(cert=><div key={cert.id} style={{ marginBottom:8 }}><div style={{ fontWeight:600, fontSize:12 }}>{cert.name}</div><div style={{ fontSize:11, color:'#666' }}>{cert.issuer} · {cert.date}</div></div>)}</MSec>}
      </div>
    </div>
  );
}

// ─── T2 Clean Minimal ─────────────────────────────────────────────────────────
function T2({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Georgia',serif", fontSize:13, color:'#2d2d2d', padding:'40px 40px' }}>
      <div style={{ borderBottom:`3px solid ${c}`, paddingBottom:20, marginBottom:24 }}>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:-1 }}>{cv.fullName||'Your Name'}</div>
        <div style={{ fontSize:14, color:c, marginTop:4, fontStyle:'italic' }}>{cv.jobTitle||'Software Engineer'}</div>
        <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap', fontSize:11, color:'#666' }}>
          {cv.email&&<span>✉ {cv.email}</span>}{cv.phone&&<span>📱 {cv.phone}</span>}
          {cv.location&&<span>📍 {cv.location}</span>}{cv.linkedin&&<span>in {cv.linkedin}</span>}
        </div>
      </div>
      {cv.summary && <div style={{ marginBottom:20, fontStyle:'italic', color:'#555', lineHeight:1.7 }}>{cv.summary}</div>}
      <div style={{ display:'flex', gap:32 }}>
        <div style={{ flex:2 }}>
          {cv.experience.length>0 && <><T2sec c={c} title="WORK EXPERIENCE" />{cv.experience.map(e=><div key={e.id} style={{ marginBottom:14 }}><div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ fontSize:11, color:'#888' }}>{e.startDate}–{e.current?'Present':e.endDate}</div></div><div style={{ color:c, fontSize:12, marginBottom:3 }}>{e.company}</div>{e.description&&<div style={{ fontSize:12, lineHeight:1.6, color:'#555' }}>{e.description}</div>}</div>)}</>}
          {cv.projects.length>0 && <><T2sec c={c} title="PROJECTS" />{cv.projects.map(p=><div key={p.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, fontSize:12 }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, lineHeight:1.5, color:'#555', marginTop:2 }}>{p.description}</div>}{p.tech.length>0&&<div style={{ fontSize:10, color:c, marginTop:2 }}>{p.tech.join(' · ')}</div>}</div>)}</>}
        </div>
        <div style={{ flex:1 }}>
          {cv.skills.length>0&&<><T2sec c={c} title="SKILLS" /><div style={{ display:'flex', flexDirection:'column', gap:3 }}>{cv.skills.map(s=><div key={s} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}><div style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }} />{s}</div>)}</div></>}
          {cv.education.length>0&&<><T2sec c={c} title="EDUCATION" />{cv.education.map(e=><div key={e.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, fontSize:12 }}>{e.degree}</div><div style={{ fontSize:11, color:c }}>{e.school}</div><div style={{ fontSize:10, color:'#888' }}>{e.field} · {e.endDate}</div></div>)}</>}
          {cv.languages.length>0&&<><T2sec c={c} title="LANGUAGES" />{cv.languages.map((l,i)=><div key={i} style={{ fontSize:12, marginBottom:4 }}>{l.lang} <span style={{ color:'#888', fontSize:10 }}>({l.level})</span></div>)}</>}
          {cv.certifications.length>0&&<><T2sec c={c} title="CERTS" />{cv.certifications.map(cert=><div key={cert.id} style={{ marginBottom:6 }}><div style={{ fontWeight:600, fontSize:11 }}>{cert.name}</div><div style={{ fontSize:10, color:'#888' }}>{cert.issuer} · {cert.date}</div></div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── T3 Bold Executive ────────────────────────────────────────────────────────
function T3({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Arial',sans-serif", fontSize:12, color:'#222' }}>
      <div style={{ background:'#1e293b', color:'#fff', padding:'28px 36px' }}>
        <div style={{ fontSize:26, fontWeight:900 }}>{cv.fullName||'Your Name'}</div>
        <div style={{ fontSize:13, color:c, marginTop:4, fontWeight:600 }}>{cv.jobTitle||'Software Engineer'}</div>
        <div style={{ display:'flex', gap:20, marginTop:12, flexWrap:'wrap', fontSize:11, opacity:0.8 }}>
          {cv.email&&<span>✉ {cv.email}</span>}{cv.phone&&<span>☎ {cv.phone}</span>}
          {cv.location&&<span>⊕ {cv.location}</span>}{cv.linkedin&&<span>LinkedIn: {cv.linkedin}</span>}
        </div>
      </div>
      <div style={{ padding:'24px 36px' }}>
        {cv.summary&&<div style={{ marginBottom:18, padding:'12px 16px', background:`${c}10`, borderLeft:`4px solid ${c}`, lineHeight:1.7 }}>{cv.summary}</div>}
        <div style={{ display:'flex', gap:28 }}>
          <div style={{ flex:3 }}>
            {cv.experience.length>0&&<><T3sec c={c} title="PROFESSIONAL EXPERIENCE" />{cv.experience.map(e=><div key={e.id} style={{ marginBottom:18, paddingBottom:12, borderBottom:'1px solid #eee' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><div style={{ fontWeight:800, fontSize:13 }}>{e.role}</div><div style={{ fontSize:10, color:'#888', background:'#f4f4f4', padding:'2px 8px', borderRadius:4 }}>{e.startDate}–{e.current?'Present':e.endDate}</div></div><div style={{ fontSize:12, color:c, fontWeight:600, marginBottom:4 }}>🏢 {e.company}</div>{e.description&&<div style={{ lineHeight:1.6, color:'#555' }}>{e.description}</div>}</div>)}</>}
            {cv.projects.length>0&&<><T3sec c={c} title="KEY PROJECTS" />{cv.projects.map(p=><div key={p.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700 }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, color:'#555', marginTop:2 }}>{p.description}</div>}</div>)}</>}
          </div>
          <div style={{ flex:1.4 }}>
            {cv.skills.length>0&&<><T3sec c={c} title="TECHNICAL SKILLS" />{cv.skills.map(s=><div key={s} style={{ padding:'3px 0', borderBottom:'1px solid #f0f0f0', fontSize:12 }}>▸ {s}</div>)}</>}
            {cv.education.length>0&&<><T3sec c={c} title="EDUCATION" />{cv.education.map(e=><div key={e.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, fontSize:12 }}>{e.degree}</div><div style={{ color:c, fontSize:11 }}>{e.school}</div><div style={{ fontSize:10, color:'#888' }}>{e.field} · {e.endDate}</div></div>)}</>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── T4 Creative Side ─────────────────────────────────────────────────────────
function T4({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Trebuchet MS',sans-serif", fontSize:12, color:'#2d2d2d', display:'flex', minHeight:'100%' }}>
      <div style={{ flex:1, background:'#f8f9ff', padding:'32px 24px', borderRight:`3px solid ${c}` }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:c, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:900, marginBottom:16 }}>{cv.fullName?cv.fullName[0]:'?'}</div>
        <div style={{ fontSize:20, fontWeight:800, lineHeight:1.2 }}>{cv.fullName||'Your Name'}</div>
        <div style={{ color:c, fontWeight:600, marginBottom:20 }}>{cv.jobTitle||'Developer'}</div>
        {cv.email&&<div style={{ fontSize:10, marginBottom:5 }}>✉ {cv.email}</div>}
        {cv.phone&&<div style={{ fontSize:10, marginBottom:5 }}>📱 {cv.phone}</div>}
        {cv.location&&<div style={{ fontSize:10, marginBottom:5 }}>📍 {cv.location}</div>}
        {cv.github&&<div style={{ fontSize:10, marginBottom:5 }}>⌥ {cv.github}</div>}
        {cv.skills.length>0&&<div style={{ marginTop:20 }}><div style={{ fontSize:10, fontWeight:700, color:c, borderBottom:`2px solid ${c}`, paddingBottom:3, marginBottom:8 }}>SKILLS</div>{cv.skills.map(s=><div key={s} style={{ padding:'3px 0', borderBottom:`1px solid ${c}20`, fontSize:11 }}>▸ {s}</div>)}</div>}
        {cv.languages.length>0&&<div style={{ marginTop:16 }}><div style={{ fontSize:10, fontWeight:700, color:c, borderBottom:`2px solid ${c}`, paddingBottom:3, marginBottom:8 }}>LANGUAGES</div>{cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, marginBottom:3 }}>{l.lang} <span style={{ color:c }}>·</span> {l.level}</div>)}</div>}
      </div>
      <div style={{ flex:2, padding:'32px 28px' }}>
        {cv.summary&&<div style={{ marginBottom:20, padding:'12px 16px', background:`${c}08`, borderRadius:8, lineHeight:1.7 }}>{cv.summary}</div>}
        {cv.experience.length>0&&<><div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:4, marginBottom:10 }}>EXPERIENCE</div>{cv.experience.map(e=><div key={e.id} style={{ marginBottom:16 }}><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ color:c, fontSize:11, marginBottom:2 }}>{e.company} · {e.startDate}–{e.current?'Now':e.endDate}</div>{e.description&&<div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{e.description}</div>}</div>)}</>}
        {cv.education.length>0&&<><div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:4, marginBottom:10, marginTop:16 }}>EDUCATION</div>{cv.education.map(e=><div key={e.id} style={{ marginBottom:12 }}><div style={{ fontWeight:700 }}>{e.degree} — {e.field}</div><div style={{ fontSize:11, color:c }}>{e.school} · {e.endDate}</div></div>)}</>}
        {cv.projects.length>0&&<><div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:c, borderBottom:`2px solid ${c}`, paddingBottom:4, marginBottom:10, marginTop:16 }}>PROJECTS</div>{cv.projects.map(p=><div key={p.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700 }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, color:'#555' }}>{p.description}</div>}{p.tech.length>0&&<div style={{ fontSize:10, color:c }}>{p.tech.join(' · ')}</div>}</div>)}</>}
      </div>
    </div>
  );
}

// ─── T5 Dark Code ─────────────────────────────────────────────────────────────
function T5({ cv }: { cv: CVData }) {
  const c = '#a89cf7';
  return (
    <div style={{ background:'#0f172a', color:'#e2e8f0', fontFamily:"'Consolas',monospace", fontSize:12, minHeight:'100%' }}>
      <div style={{ background:'#1e293b', padding:'28px 36px', borderBottom:'2px solid #6B5FE6' }}>
        <div style={{ fontSize:24, fontWeight:900, color:'#fff' }}>{cv.fullName||'Your Name'}</div>
        <div style={{ color:c, fontSize:13, marginTop:4 }}>// {cv.jobTitle||'Software Developer'}</div>
        <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap', fontSize:10, color:'#94a3b8' }}>
          {cv.email&&<span>email: "{cv.email}"</span>}{cv.location&&<span>location: "{cv.location}"</span>}{cv.github&&<span>github: "{cv.github}"</span>}
        </div>
      </div>
      {cv.summary&&<div style={{ padding:'8px 36px', background:'#1e293b', borderLeft:'3px solid #6B5FE6', margin:'0', fontSize:11, color:'#94a3b8', lineHeight:1.65 }}>/* {cv.summary} */</div>}
      <div style={{ padding:'24px 36px', display:'flex', gap:28 }}>
        <div style={{ flex:2 }}>
          {cv.experience.length>0&&<><div style={{ fontSize:11, fontWeight:700, color:c, margin:'0 0 8px' }}>const work_experience = {'{'}</div>{cv.experience.map(e=><div key={e.id} style={{ marginBottom:12, padding:'8px', background:'#1e293b', borderRadius:5 }}><div style={{ fontWeight:700, color:'#fff' }}>{e.role}</div><div style={{ color:c, fontSize:11 }}>{e.company}</div><div style={{ color:'#64748b', fontSize:10 }}>{e.startDate} → {e.current?'now':e.endDate}</div>{e.description&&<div style={{ color:'#94a3b8', fontSize:11, marginTop:3, lineHeight:1.6 }}>{e.description}</div>}</div>)}</>}
          {cv.projects.length>0&&<><div style={{ fontSize:11, fontWeight:700, color:c, margin:'16px 0 8px' }}>const projects = {'['}</div>{cv.projects.map(p=><div key={p.id} style={{ marginBottom:8, padding:'7px', background:'#1e293b', borderRadius:5 }}><div style={{ fontWeight:700, color:'#a89cf7' }}>▸ {p.name}</div>{p.description&&<div style={{ color:'#94a3b8', fontSize:10, lineHeight:1.5 }}>{p.description}</div>}</div>)}</>}
        </div>
        <div style={{ flex:1 }}>
          {cv.skills.length>0&&<><div style={{ fontSize:11, fontWeight:700, color:c, marginBottom:5 }}>const skills = {'['}</div>{cv.skills.map(s=><div key={s} style={{ fontSize:11, color:'#a5b4fc', marginBottom:3 }}>"{s}",</div>)}</>}
          {cv.education.length>0&&<><div style={{ fontSize:11, fontWeight:700, color:c, margin:'16px 0 5px' }}>const education = {'{'}</div>{cv.education.map(e=><div key={e.id} style={{ marginBottom:8, fontSize:11, color:'#94a3b8' }}><div style={{ color:'#fff' }}>{e.degree}</div><div>{e.school}</div><div style={{ color:'#64748b' }}>{e.field} · {e.endDate}</div></div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── T6 Elegant Classic ───────────────────────────────────────────────────────
function T6({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Palatino','Georgia',serif", fontSize:13, color:'#2d2d2d', padding:40 }}>
      <div style={{ textAlign:'center', borderBottom:'1px solid #ddd', paddingBottom:20, marginBottom:24 }}>
        <div style={{ fontSize:30, fontWeight:900, letterSpacing:3, color:'#1a1a2e' }}>{(cv.fullName||'YOUR NAME').toUpperCase()}</div>
        <div style={{ color:c, fontSize:14, letterSpacing:2, marginTop:6, fontStyle:'italic' }}>{cv.jobTitle||'Software Engineer'}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:10, fontSize:11, color:'#666', flexWrap:'wrap' }}>
          {cv.email&&<span>{cv.email}</span>}{cv.phone&&<><span>|</span><span>{cv.phone}</span></>}{cv.location&&<><span>|</span><span>{cv.location}</span></>}
        </div>
      </div>
      {cv.summary&&<div style={{ textAlign:'center', fontStyle:'italic', color:'#555', lineHeight:1.8, marginBottom:24 }}>{cv.summary}</div>}
      {cv.experience.length>0&&<><ElegDiv c={c} title="Professional Experience" />{cv.experience.map(e=><div key={e.id} style={{ marginBottom:16 }}><div style={{ display:'flex', justifyContent:'space-between' }}><div><span style={{ fontWeight:700 }}>{e.role}</span> — <span style={{ color:c }}>{e.company}</span></div><span style={{ fontSize:11, color:'#888' }}>{e.startDate}–{e.current?'Present':e.endDate}</span></div>{e.description&&<div style={{ marginTop:4, lineHeight:1.7, fontSize:12, color:'#444' }}>{e.description}</div>}</div>)}</>}
      <div style={{ display:'flex', gap:32 }}>
        <div style={{ flex:2 }}>
          {cv.projects.length>0&&<><ElegDiv c={c} title="Projects" />{cv.projects.map(p=><div key={p.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, fontSize:12 }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, color:'#555' }}>{p.description}</div>}</div>)}</>}
        </div>
        <div style={{ flex:1 }}>
          {cv.skills.length>0&&<><ElegDiv c={c} title="Skills" /><div style={{ columns:2, fontSize:11, lineHeight:2 }}>{cv.skills.map(s=><div key={s}>· {s}</div>)}</div></>}
          {cv.education.length>0&&<><ElegDiv c={c} title="Education" />{cv.education.map(e=><div key={e.id} style={{ marginBottom:8, fontSize:12 }}><div style={{ fontWeight:700 }}>{e.degree} in {e.field}</div><div style={{ color:c }}>{e.school} · {e.endDate}</div></div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── T7 Compact Grid ──────────────────────────────────────────────────────────
function T7({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Arial Narrow','Arial',sans-serif", fontSize:11, color:'#222', padding:'20px 28px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, background:c, color:'#fff', padding:'16px 20px', borderRadius:4, marginBottom:16 }}>
        <div><div style={{ fontSize:20, fontWeight:900 }}>{cv.fullName||'Your Name'}</div><div style={{ fontSize:11, opacity:0.8 }}>{cv.jobTitle||'Software Engineer'}</div></div>
        <div style={{ fontSize:10, opacity:0.9, display:'flex', flexDirection:'column', justifyContent:'center', gap:2 }}>{cv.email&&<span>✉ {cv.email}</span>}{cv.phone&&<span>☎ {cv.phone}</span>}{cv.location&&<span>⊕ {cv.location}</span>}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          {cv.summary&&<><div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, color:c, borderBottom:`1px solid ${c}`, paddingBottom:3, marginBottom:7 }}>SUMMARY</div><p style={{ margin:0, lineHeight:1.6, fontSize:11 }}>{cv.summary}</p></>}
          {cv.experience.length>0&&<><div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, color:c, borderBottom:`1px solid ${c}`, paddingBottom:3, marginBottom:7, marginTop:14 }}>EXPERIENCE</div>{cv.experience.map(e=><div key={e.id} style={{ marginBottom:10, padding:'7px', background:'#f8f8f8', borderRadius:4, borderLeft:`2px solid ${c}` }}><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ color:c, fontSize:10 }}>{e.company} · {e.startDate}–{e.current?'Now':e.endDate}</div>{e.description&&<div style={{ fontSize:10, marginTop:2, color:'#555' }}>{e.description}</div>}</div>)}</>}
        </div>
        <div>
          {cv.skills.length>0&&<><div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, color:c, borderBottom:`1px solid ${c}`, paddingBottom:3, marginBottom:7 }}>SKILLS</div><div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{cv.skills.map(s=><span key={s} style={{ background:`${c}15`, color:c, borderRadius:3, padding:'2px 6px', fontSize:9.5 }}>{s}</span>)}</div></>}
          {cv.education.length>0&&<><div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, color:c, borderBottom:`1px solid ${c}`, paddingBottom:3, marginBottom:7, marginTop:14 }}>EDUCATION</div>{cv.education.map(e=><div key={e.id} style={{ marginBottom:7, padding:'5px 7px', background:'#f8f8f8', borderRadius:4 }}><div style={{ fontWeight:700, fontSize:11 }}>{e.degree}</div><div style={{ color:c, fontSize:10 }}>{e.school}</div><div style={{ fontSize:9.5, color:'#666' }}>{e.field} · {e.endDate}</div></div>)}</>}
          {cv.projects.length>0&&<><div style={{ fontSize:9.5, fontWeight:700, letterSpacing:1.5, color:c, borderBottom:`1px solid ${c}`, paddingBottom:3, marginBottom:7, marginTop:14 }}>PROJECTS</div>{cv.projects.map(p=><div key={p.id} style={{ marginBottom:7, padding:'5px 7px', background:'#f8f8f8', borderRadius:4 }}><div style={{ fontWeight:700, fontSize:11 }}>{p.name}</div>{p.description&&<div style={{ fontSize:10, color:'#555' }}>{p.description}</div>}</div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── T8 Gradient Pro ──────────────────────────────────────────────────────────
function T8({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", fontSize:12.5, color:'#1a1a2e' }}>
      <div style={{ background:c, color:'#fff', padding:'36px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-40, top:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:28, fontWeight:900 }}>{cv.fullName||'Your Name'}</div>
          <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>{cv.jobTitle||'Software Engineer'}</div>
          <div style={{ display:'flex', gap:18, marginTop:12, flexWrap:'wrap', fontSize:11, opacity:0.75 }}>
            {cv.email&&<span>✉ {cv.email}</span>}{cv.phone&&<span>📱 {cv.phone}</span>}{cv.location&&<span>📍 {cv.location}</span>}
          </div>
        </div>
      </div>
      <div style={{ padding:'28px 40px', display:'flex', gap:28 }}>
        <div style={{ flex:3 }}>
          {cv.summary&&<div style={{ marginBottom:20, padding:'12px 16px', background:`${c}08`, borderRadius:8, lineHeight:1.7, borderLeft:`3px solid ${c}` }}>{cv.summary}</div>}
          {cv.experience.length>0&&<><T8lbl c={c} t="Experience" />{cv.experience.map(e=><div key={e.id} style={{ marginBottom:14, display:'flex', gap:10 }}><div style={{ width:34, height:34, borderRadius:'50%', background:`${c}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:c, fontWeight:900, fontSize:14 }}>{e.company?e.company[0]:'?'}</div><div style={{ flex:1 }}><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ color:c, fontSize:11 }}>{e.company} · {e.startDate}–{e.current?'Present':e.endDate}</div>{e.description&&<div style={{ fontSize:11, color:'#555', lineHeight:1.6, marginTop:2 }}>{e.description}</div>}</div></div>)}</>}
          {cv.projects.length>0&&<><T8lbl c={c} t="Projects" />{cv.projects.map(p=><div key={p.id} style={{ marginBottom:9, padding:'7px 12px', background:'#f8f9ff', borderRadius:6 }}><div style={{ fontWeight:700, color:c }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, color:'#555' }}>{p.description}</div>}</div>)}</>}
        </div>
        <div style={{ flex:1.5 }}>
          {cv.skills.length>0&&<><T8lbl c={c} t="Skills" />{cv.skills.map(s=><div key={s} style={{ padding:'4px 8px', background:`${c}10`, borderRadius:4, fontSize:11, color:c, fontWeight:600, marginBottom:4 }}>{s}</div>)}</>}
          {cv.education.length>0&&<><T8lbl c={c} t="Education" />{cv.education.map(e=><div key={e.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, fontSize:12 }}>{e.degree}</div><div style={{ color:c, fontSize:11 }}>{e.school}</div><div style={{ fontSize:10, color:'#888' }}>{e.field} · {e.endDate}</div></div>)}</>}
          {cv.languages.length>0&&<><T8lbl c={c} t="Languages" />{cv.languages.map((l,i)=><div key={i} style={{ fontSize:11, marginBottom:4 }}>{l.lang} <span style={{ color:c }}>·</span> {l.level}</div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── T9 Two-Column Edge ───────────────────────────────────────────────────────
function T9({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Calibri',sans-serif", fontSize:12.5, color:'#1e293b', display:'flex', minHeight:'100%' }}>
      <div style={{ width:240, background:'#1e293b', color:'#e2e8f0', padding:'32px 22px', flexShrink:0 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:4 }}>{cv.fullName||'Your Name'}</div>
        <div style={{ color:c, fontSize:12, fontWeight:600, marginBottom:20 }}>{cv.jobTitle||'Software Engineer'}</div>
        {cv.email&&<div style={{ fontSize:10, marginBottom:4, opacity:0.8, wordBreak:'break-all' }}>{cv.email}</div>}
        {cv.phone&&<div style={{ fontSize:10, marginBottom:4, opacity:0.8 }}>{cv.phone}</div>}
        {cv.location&&<div style={{ fontSize:10, marginBottom:4, opacity:0.8 }}>{cv.location}</div>}
        {cv.skills.length>0&&<><div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:c, marginTop:18, marginBottom:7 }}>SKILLS</div>{cv.skills.map(s=><div key={s} style={{ fontSize:10, padding:'2px 0', borderBottom:'1px solid rgba(255,255,255,0.08)', opacity:0.85 }}>▸ {s}</div>)}</>}
        {cv.languages.length>0&&<><div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:c, marginTop:18, marginBottom:7 }}>LANGUAGES</div>{cv.languages.map((l,i)=><div key={i} style={{ fontSize:10, marginBottom:4, opacity:0.8 }}>{l.lang} — {l.level}</div>)}</>}
      </div>
      <div style={{ flex:1, padding:'32px 28px' }}>
        {cv.summary&&<div style={{ marginBottom:20, fontSize:12, lineHeight:1.7, color:'#475569', background:'#f8fafc', padding:'12px 14px', borderRadius:6, borderLeft:`3px solid ${c}` }}>{cv.summary}</div>}
        {cv.experience.length>0&&<><T9lbl c={c} t="EXPERIENCE" />{cv.experience.map(e=><div key={e.id} style={{ marginBottom:14, paddingBottom:11, borderBottom:'1px solid #e2e8f0' }}><div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ fontWeight:700, fontSize:13 }}>{e.role}</div><div style={{ fontSize:10, color:'#94a3b8' }}>{e.startDate}–{e.current?'Present':e.endDate}</div></div><div style={{ color:c, fontSize:11, fontWeight:600, marginBottom:3 }}>{e.company}</div>{e.description&&<div style={{ fontSize:11, lineHeight:1.6, color:'#64748b' }}>{e.description}</div>}</div>)}</>}
        {cv.projects.length>0&&<><T9lbl c={c} t="PROJECTS" />{cv.projects.map(p=><div key={p.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700, color:c }}>{p.name}</div>{p.description&&<div style={{ fontSize:11, color:'#64748b', lineHeight:1.5 }}>{p.description}</div>}</div>)}</>}
        {cv.education.length>0&&<><T9lbl c={c} t="EDUCATION" />{cv.education.map(e=><div key={e.id} style={{ marginBottom:10 }}><div style={{ fontWeight:700 }}>{e.degree} in {e.field}</div><div style={{ color:c, fontSize:11 }}>{e.school}</div><div style={{ fontSize:10, color:'#94a3b8' }}>{e.startDate}–{e.endDate}{e.gpa?` · GPA: ${e.gpa}`:''}</div></div>)}</>}
      </div>
    </div>
  );
}

// ─── T10 Blueprint Code ───────────────────────────────────────────────────────
function T10({ cv }: { cv: CVData }) {
  const c = cv.accentColor;
  return (
    <div style={{ fontFamily:"'Lucida Console',monospace", fontSize:11.5, color:'#0f2027', background:'#fff' }}>
      <div style={{ background:'#0f2027', padding:'24px 32px', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:1 }}>{cv.fullName||'Your Name'}</div>
          <div style={{ color:c, fontSize:12, marginTop:3 }}>$ whoami → {cv.jobTitle||'Software Engineer'}</div>
        </div>
        <div style={{ fontSize:9.5, color:'#64748b', textAlign:'right', lineHeight:1.9 }}>
          {cv.email&&<div>// {cv.email}</div>}{cv.phone&&<div>// {cv.phone}</div>}{cv.location&&<div>// {cv.location}</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:0 }}>
        <div style={{ width:200, background:'#f0f4f8', padding:'20px 16px', borderRight:`2px solid ${c}20` }}>
          {cv.skills.length>0&&<><div style={{ fontSize:10, fontWeight:700, color:c, margin:'0 0 6px' }}>$ ls skills/</div>{cv.skills.map(s=><div key={s} style={{ fontSize:10, marginBottom:3, color:'#334155' }}>├─ {s}</div>)}</>}
          {cv.languages.length>0&&<><div style={{ fontSize:10, fontWeight:700, color:c, margin:'12px 0 6px' }}>$ ls langs/</div>{cv.languages.map((l,i)=><div key={i} style={{ fontSize:10, marginBottom:2 }}>├─ {l.lang} ({l.level})</div>)}</>}
          {cv.education.length>0&&<><div style={{ fontSize:10, fontWeight:700, color:c, margin:'12px 0 6px' }}>$ cat edu.log</div>{cv.education.map(e=><div key={e.id} style={{ marginBottom:7, fontSize:10 }}><div style={{ fontWeight:700 }}>{e.degree}</div><div style={{ color:c }}>{e.school}</div><div style={{ color:'#94a3b8' }}>{e.field} · {e.endDate}</div></div>)}</>}
        </div>
        <div style={{ flex:1, padding:'20px 24px' }}>
          {cv.summary&&<div style={{ marginBottom:14, padding:'9px 12px', background:'#f0f4f8', borderRadius:4, fontSize:11, lineHeight:1.7, borderLeft:`3px solid ${c}` }}><span style={{ color:c, fontWeight:700 }}># </span>{cv.summary}</div>}
          {cv.experience.length>0&&<><div style={{ fontSize:10, fontWeight:700, color:c, margin:'0 0 6px' }}>$ git log --jobs</div>{cv.experience.map(e=><div key={e.id} style={{ marginBottom:12, padding:'7px 10px', background:'#f8fafc', borderRadius:4, borderLeft:`2px solid ${c}` }}><div style={{ display:'flex', justifyContent:'space-between' }}><div style={{ fontWeight:700 }}>{e.role}</div><div style={{ fontSize:9.5, color:'#94a3b8' }}>{e.startDate}..{e.current?'HEAD':e.endDate}</div></div><div style={{ color:c, fontSize:10 }}>@ {e.company}</div>{e.description&&<div style={{ fontSize:10, color:'#475569', lineHeight:1.5, marginTop:2 }}>{e.description}</div>}</div>)}</>}
          {cv.projects.length>0&&<><div style={{ fontSize:10, fontWeight:700, color:c, margin:'14px 0 6px' }}>$ ls projects/</div>{cv.projects.map(p=><div key={p.id} style={{ marginBottom:9, padding:'5px 10px', background:'#f8fafc', borderRadius:4 }}><div style={{ fontWeight:700, color:c }}>▸ {p.name}/</div>{p.description&&<div style={{ fontSize:10, color:'#475569', lineHeight:1.5 }}>{p.description}</div>}</div>)}</>}
        </div>
      </div>
    </div>
  );
}

// ─── Template Dispatch ────────────────────────────────────────────────────────
export default function CVPreview({ cv }: { cv: CVData }) {
  switch (cv.templateId) {
    case 1:  return <T1  cv={cv} />;
    case 2:  return <T2  cv={cv} />;
    case 3:  return <T3  cv={cv} />;
    case 4:  return <T4  cv={cv} />;
    case 5:  return <T5  cv={cv} />;
    case 6:  return <T6  cv={cv} />;
    case 7:  return <T7  cv={cv} />;
    case 8:  return <T8  cv={cv} />;
    case 9:  return <T9  cv={cv} />;
    case 10: return <T10 cv={cv} />;
    default: return <T1  cv={cv} />;
  }
}
