import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, type SessionUser } from '../../../shared/AuthContext';
import { API_BASE_URL } from '../../../shared/api';
import './PageIndex.css';
import { sitePageGroups as groups } from '../../../shared/sitePages';



export default function PageIndex() {
  const { user, completeLogin } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function startPreview(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token.trim()}` } });
      if (!response.ok) throw new Error();
      const data: { user: SessionUser } = await response.json();
      completeLogin(token.trim(), data.user); setToken('');
    } catch { setError('تعذّر بدء الجلسة التجريبية. تأكد من صلاحية رمز الجلسة وتشغيل الخادم.'); }
    finally { setBusy(false); }
  }
  return <main className="page-index" dir="rtl">
    <div className="page-index-content">
      <p className="page-index-label">دليل المشروع</p><h1>كل الواجهات في مكان واحد</h1>
      <p className="page-index-intro">اختر صفحة لمراجعتها. الصفحات المحمية تحتاج جلسة مستخدم أو مدير، وبعضها يعرض بيانات عند توفرها.</p>
      <div className="page-index-session"><strong>{user ? `الجلسة الحالية: ${user.name || user.email}` : 'لا توجد جلسة حالية'}</strong><span>{user ? `الصلاحية: ${user.role}` : 'تسجيل الدخول مطلوب لصفحات الحساب والإدارة.'}</span></div>
      {import.meta.env.DEV && !user && <details className="page-index-auth"><summary>بدء جلسة معاينة محلية</summary><p>أدخل رمز الجلسة التجريبية المحلي للوصول إلى الصفحات المحمية.</p><form onSubmit={startPreview}><label htmlFor="preview-token">رمز الجلسة</label><input id="preview-token" type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} required /><button disabled={busy}>{busy ? 'جارٍ التحقق...' : 'بدء المعاينة'}</button></form>{error && <p role="alert">{error}</p>}</details>}
      {groups.map(group => <section className="page-index-group" key={group.title}><div className="page-index-group-title"><h2>{group.title}</h2><span>{group.items.length} صفحات</span></div><div className="page-index-links">{group.items.map(({name, path, access}) => <Link key={path} to={path}><span>{name}{access && <small style={{display: 'block', fontWeight: 400, marginTop: 4}}>{access}</small>}</span><span aria-hidden="true">←</span></Link>)}</div></section>)}
      <p className="page-index-note">تفاصيل الشركة الإدارية تحتاج اختيار شركة من صفحة إدارة الشركات. بعض الخدمات تحتاج إعدادات أو بيانات إضافية.</p>
    </div>
  </main>;
}
