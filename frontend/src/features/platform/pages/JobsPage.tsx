import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import JobCard from '../components/jobs/JobCard';
import FilterSidebar from '../components/jobs/FilterSidebar';
import SortBar from '../components/jobs/SortBar';
import { searchJobs, type JobsSearchResponse } from '../api/jobsSearch';
import { jobsApiQuery, readJobsSearch, patchJobsSearch, type JobsSearchState } from '../utils/jobsSearch';
import './JobsPage.css';
export default function JobsPage() {
  const [params, setParams] = useSearchParams(); const location = useLocation();
  const state = useMemo(() => readJobsSearch(params), [params]); const query = jobsApiQuery(state).toString();
  const [resultQuery, setResultQuery] = useState('');
  const [result, setResult] = useState<JobsSearchResponse | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = window.setTimeout(() => {
      void searchJobs(new URLSearchParams(query), controller.signal).then(data => { if (!controller.signal.aborted) { setResult(data); setResultQuery(query); } })
        .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : 'تعذر تحميل الوظائف. تحقق من الاتصال وأعد المحاولة.'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, attempt]);
  useEffect(() => { if (!loading && !error && resultQuery === query && result && result.page !== state.page) setParams(previous => patchJobsSearch(previous, { page: result.page }), { replace: true }); }, [result, resultQuery, query, loading, error, state.page, setParams]);
  const waiting = loading || (!error && resultQuery !== query);
  const change = (patch: Partial<JobsSearchState>) => setParams(previous => patchJobsSearch(previous, patch));
  const reset = () => setParams(new URLSearchParams());
  return <div className="jobs-page"><header className="jobs-page-heading"><h1>فرص العمل</h1><p>ابحث باسم الوظيفة أو الشركة أو المجال، وحدد ما يناسبك من الفلاتر.</p></header>
    <SortBar total={!error && resultQuery === query ? result?.total || 0 : 0} loading={waiting} state={state} onChange={change} onToggleFilters={() => setShowFilters(value => !value)} showFilters={showFilters} />
    <div className="jobs-search-layout"><div id="jobs-filters" className={'jobs-filters-wrapper' + (showFilters ? ' is-open' : '')}><FilterSidebar filters={state} onChange={change} onReset={reset} /></div>
      <section className="jobs-results" aria-label="نتائج الوظائف" aria-busy={waiting}>
        {waiting ? <p className="jobs-message" role="status">جارٍ تحميل النتائج…</p> : error ? <div className="jobs-message"><p role="alert">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button><button type="button" onClick={reset}>مسح البحث والفلاتر</button></div> : !result?.jobs.length ? <div className="jobs-message"><h2>لا توجد وظائف مطابقة</h2><p>جرّب بحثًا آخر أو وسّع الفلاتر.</p><button type="button" onClick={reset}>مسح البحث والفلاتر</button>{state.availability === 'open' && <button type="button" onClick={() => change({ availability: 'all' })}>عرض الوظائف المنتهي موعدها أيضًا</button>}</div> : <>
          {state.q.trim() && <p className="jobs-query-note">نتائج البحث عن «{state.q.trim()}»</p>}
          {state.sort === 'salary' && <p className="jobs-query-note">تظهر الوظائف ذات الراتب المعلن بعملة {state.currency} فقط.</p>}
          <div className="jobs-results-grid">{result.jobs.map(job => <JobCard key={job._id} job={job} fromJobs={location.pathname + location.search} />)}</div>
          {result.pages > 1 && <nav className="jobs-pagination" aria-label="صفحات الوظائف"><button type="button" disabled={result.page <= 1} onClick={() => change({ page: result.page - 1 })}>السابق</button><span>الصفحة {result.page.toLocaleString('ar')} من {result.pages.toLocaleString('ar')}</span><button type="button" disabled={result.page >= result.pages} onClick={() => change({ page: result.page + 1 })}>التالي</button></nav>}
        </>}
      </section></div>
  </div>;
}
