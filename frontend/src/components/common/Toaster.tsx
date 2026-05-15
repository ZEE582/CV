import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toaster() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 22px', borderRadius: 12,
          fontFamily: "'Tajawal',sans-serif", fontSize: 14, fontWeight: 600, color: '#fff',
          background: t.type === 'ok'
            ? 'linear-gradient(135deg,#7b68ee,#9b8afe)'
            : 'linear-gradient(135deg,#ef4444,#f87171)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          animation: 'fadeUp .25s ease',
        }}>
          {t.type === 'ok' ? '✓ ' : '✗ '}{t.message}
        </div>
      ))}
    </div>
  );
}
