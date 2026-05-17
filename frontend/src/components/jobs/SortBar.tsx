import React from 'react';

const SORTS = [
  { val: 'newest',   label: 'الأحدث' },
  { val: 'featured', label: '⭐ المميزة' },
  { val: 'salary',   label: '💰 الراتب' },
];

interface Props {
  total: number;
  sort: string;
  onSort: (v: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export default function SortBar({ total, sort, onSort, onToggleFilters, showFilters }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 14, color: '#9999bb' }}>
          <span style={{ fontWeight: 700, color: '#7b68ee' }}>{total}</span> وظيفة تقنية
        </div>
        <button onClick={onToggleFilters} className="filter-toggle-btn"
          style={{ fontFamily: "'Tajawal',sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(107,95,230,0.3)', background: showFilters ? 'rgba(107,95,230,0.10)' : 'rgba(255,255,255,0.8)', color: '#7b68ee', display: 'none' }}>
          🔽 فلاتر
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {SORTS.map(o => (
          <button key={o.val} onClick={() => onSort(o.val)}
            style={{ padding: '5px clamp(8px,2vw,13px)', borderRadius: 8, fontSize: 'clamp(11px,2vw,12px)', fontFamily: "'Tajawal',sans-serif", cursor: 'pointer', transition: 'all .15s', border: '1px solid', borderColor: sort === o.val ? '#7b68ee' : 'rgba(0,0,0,0.09)', background: sort === o.val ? '#7b68ee' : 'rgba(255,255,255,0.8)', color: sort === o.val ? '#fff' : '#7777aa', boxShadow: sort === o.val ? '0 2px 8px rgba(107,95,230,0.25)' : 'none' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
