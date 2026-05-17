import React from 'react';
import { AC, ACL, ACB } from './cv.types';

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, labelAr, value, onChange, placeholder, type='text', rows }: {
  label:string; labelAr:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; rows?:number;
}) {
  const base: React.CSSProperties = {
    width:'100%', padding:'9px 12px', borderRadius:8,
    border:`1px solid ${ACB}`, background:'#fff',
    fontSize:13, fontFamily:"'Segoe UI',sans-serif", color:'#1a1a2e',
    outline:'none', boxSizing:'border-box',
  };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#555577', marginBottom:4 }}>
        {label} <span style={{ color:'#9090bb', fontWeight:400 }}>/ {labelAr}</span>
      </label>
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, resize:'vertical', lineHeight:1.5 }} />
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ onClick, children, variant='primary', small }: {
  onClick:()=>void; children:React.ReactNode; variant?:'primary'|'ghost'|'danger'; small?:boolean;
}) {
  const map = {
    primary:{ background:AC, color:'#fff', border:`1px solid ${AC}` },
    ghost:  { background:ACL, color:AC, border:ACB },
    danger: { background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5' },
  };
  return (
    <button onClick={onClick} style={{
      ...map[variant], borderRadius:8, padding:small?'5px 12px':'9px 18px',
      fontSize:small?12:13, fontWeight:600, cursor:'pointer',
      fontFamily:"'Segoe UI',sans-serif",
    }}>{children}</button>
  );
}
