import React from 'react';

interface Props { icon?: string; title: string; sub?: string; }

export default function EmptyState({ icon = '🔍', title, sub }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'Tajawal',sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{title}</p>
      {sub && <p style={{ fontSize: 13, color: '#9999bb', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}
