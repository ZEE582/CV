import React from 'react';

interface Props { label: string; bg?: string; color?: string; }

export default function Tag({ label, bg = 'rgba(0,0,0,0.05)', color = '#555577' }: Props) {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99, fontSize: 11,
      fontFamily: "'Tajawal',sans-serif", background: bg, color,
    }}>
      {label}
    </span>
  );
}
