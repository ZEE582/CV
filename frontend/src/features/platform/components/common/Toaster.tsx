import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toaster() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'ok' ? '#22c55e' : '#ef4444',
          color: '#fff', padding: '10px 22px', borderRadius: 99,
          fontFamily: "'Tajawal',sans-serif", fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeUp .25s ease',
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
