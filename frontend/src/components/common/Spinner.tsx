import React from 'react';

interface Props { label?: string; }

export default function Spinner({ label = 'جاري التحميل…' }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e0f0', borderTopColor: '#7b68ee', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <span style={{ fontFamily: "'Tajawal',sans-serif", color: '#9999bb', fontSize: 14 }}>{label}</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
