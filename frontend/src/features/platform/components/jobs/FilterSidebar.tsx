import { useId } from 'react';
import { JOB_TYPES, EXPERIENCE_LEVELS, REGIONS, FIELDS, type JobsSearchState } from '../../utils/jobsSearch';
interface Props { filters: JobsSearchState; onChange: (value: Partial<JobsSearchState>) => void; onReset: () => void }
export default function FilterSidebar({ filters, onChange, onReset }: Props) {
  const id = useId();
  const fields = [{ key: 'field', label: 'المجال', options: FIELDS }, { key: 'type', label: 'نوع العمل', options: JOB_TYPES }, { key: 'exp', label: 'مستوى الخبرة', options: EXPERIENCE_LEVELS }, { key: 'reg', label: 'المنطقة', options: REGIONS }] as const;
  return <aside className="jobs-filter-panel" aria-label="تصفية الوظائف"><h2>فلترة النتائج</h2>
    {fields.map(field => <div className="jobs-filter-field" key={field.key}><label htmlFor={id + field.key}>{field.label}</label><select id={id + field.key} value={filters[field.key]} onChange={event => onChange({ [field.key]: event.target.value })}><option value="">الكل</option>{[...new Set([...field.options, ...(filters[field.key] ? [filters[field.key]] : [])])].map(value => <option key={value} value={value}>{value === 'remote' ? 'عن بُعد' : value}</option>)}</select></div>)}
    <div className="jobs-filter-field"><label htmlFor={id + 'availability'}>حالة التقديم</label><select id={id + 'availability'} value={filters.availability} onChange={event => onChange({ availability: event.target.value as JobsSearchState['availability'] })}><option value="open">التقديم مفتوح</option><option value="all">كل الوظائف المنشورة</option></select></div>
    <button className="jobs-reset" type="button" onClick={onReset}>مسح البحث والفلاتر</button>
  </aside>;
}
