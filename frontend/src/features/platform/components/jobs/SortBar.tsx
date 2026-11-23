import { CURRENCIES, type JobsSearchState, type JobSort } from '../../utils/jobsSearch';
interface Props { total: number; loading: boolean; state: JobsSearchState; onChange: (patch: Partial<JobsSearchState>) => void; onToggleFilters: () => void; showFilters: boolean }
export default function SortBar({ total, loading, state, onChange, onToggleFilters, showFilters }: Props) {
  return <div className="jobs-sortbar"><p role="status" aria-live="polite">{loading ? 'جارٍ البحث عن الوظائف…' : <><strong>{total.toLocaleString('ar')}</strong> نتيجة</>}</p>
    <button type="button" className="jobs-filter-toggle" aria-expanded={showFilters} aria-controls="jobs-filters" onClick={onToggleFilters}>{showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}</button>
    <div className="jobs-sort-controls"><label htmlFor="jobs-sort">الترتيب</label><select id="jobs-sort" value={state.sort} onChange={event => onChange({ sort: event.target.value as JobSort })}><option value="newest">الأحدث</option><option value="featured">المميزة أولًا</option><option value="salary">الراتب المعلن الأعلى</option></select>
      {state.sort === 'salary' && <><label htmlFor="jobs-currency">العملة</label><select id="jobs-currency" value={state.currency} onChange={event => onChange({ currency: event.target.value })}>{CURRENCIES.map(value => <option key={value} value={value}>{value}</option>)}</select></>}
    </div></div>;
}
