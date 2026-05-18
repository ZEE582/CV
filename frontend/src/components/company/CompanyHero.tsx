import React from 'react';
import type { Company } from '../../types';
import { ini } from '../../utils/helpers';

interface Props { co: Company; color: string; }

const T: React.CSSProperties = { fontFamily: "'Tajawal',sans-serif" };

export default function CompanyHero({ co, color }: Props) {
  return (
    <div style={{ background: `linear-gradient(135deg,${color}18,${color}08)`, borderRadius: 20, border: `1px solid ${color}22`, padding: 32, marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* أيقونة الشركة */}
        <div style={{ width: 72, height: 72, borderRadius: 18, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 24, ...T, flexShrink: 0, boxShadow: `0 8px 24px ${color}44` }}>
          {co.logo_url
            ? <img src={co.logo_url} alt={co.name_ar} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 18 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
            : ini(co.name_ar)}
        </div>

        {/* المعلومات الرئيسية */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ ...T, fontWeight: 900, fontSize: 26, color: '#1a1a2e', margin: 0 }}>{co.name_ar}</h1>
            {co.is_verified && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, ...T }}>✓ موثقة</span>}
          </div>
          {co.name_en && <div style={{ ...T, fontSize: 14, color: '#8080aa', marginBottom: 10 }}>{co.name_en}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {co.sector       && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: `${color}15`, color }}>{co.sector}</span>}
            {co.region       && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(59,130,246,0.09)', color: '#2563eb' }}>📍 {co.region}</span>}
            {co.size         && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#555577' }}>👥 {co.size}</span>}
            {co.founded_year && <span style={{ ...T, fontSize: 12, padding: '3px 11px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#555577' }}>📅 {co.founded_year}</span>}
          </div>
        </div>

        {/* روابط */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {co.website && <a href={co.website} target="_blank" rel="noopener noreferrer" style={{ ...T, fontSize: 13, color, textDecoration: 'none' }}>🌐 {co.website}</a>}
          {co.email   && <a href={`mailto:${co.email}`} style={{ ...T, fontSize: 13, color, textDecoration: 'none' }}>✉️ {co.email}</a>}
        </div>
      </div>

      {co.about_ar && (
        <p style={{ ...T, fontSize: 14, color: '#444466', lineHeight: 1.9, marginTop: 20, maxWidth: 680 }}>{co.about_ar}</p>
      )}
    </div>
  );
}
