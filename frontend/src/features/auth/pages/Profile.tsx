import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useAuth, type SessionUser } from '../../../shared/AuthContext';
import type { UserProfile } from '../types/user';
import { createProfileClient } from '../services/profileService';
import UnsavedNavigation from '../../../shared/UnsavedNavigation';
import ProfileHeader from '../components/profilecompon/ProfileHeader';
import ScoreCard from '../components/profilecompon/ScoreCard';
import ProfileSection from '../components/profilecompon/ProfileSection';
import InfoItem from '../components/profilecompon/InfoItem';
import ProfileEditor from '../components/profilecompon/ProfileEditor';
import ChangePasswordForm from '../components/profilecompon/ChangePasswordForm';
import './Login.css';
import './Profile.css';
export default function Profile() { const { user } = useAuth(); return user ? <ProfileContent key={user._id} account={user} /> : null; }
function ProfileContent({ account }: { account: SessionUser }) {
  const { updateUser } = useAuth(); const [client] = useState(() => createProfileClient(account._id));
  const [user, setUser] = useState<UserProfile | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); const [attempt, setAttempt] = useState(0); const [editing, setEditing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [draftState, setDraftState] = useState({ dirty: false, busy: false });
  const editorState = useCallback((dirty: boolean, busy: boolean) => setDraftState({ dirty, busy }), []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    client.load(controller.signal).then(profile => { if (!controller.signal.aborted) { setUser(profile); updateUser(profile); } })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'تعذر تحميل الملف الشخصي. أعد المحاولة.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, updateUser, client]);
  function closeEditor() { setEditing(false); setDraftState({ dirty: false, busy: false }); requestAnimationFrame(() => heading.current?.focus()); }
  function saved(profile: UserProfile) { setUser(profile); updateUser(profile); closeEditor(); setSuccess('تم حفظ تعديلات ملفك الشخصي.'); }
  const onboarding = user?.onboardingData;
  const providers: Record<string, string> = { local: 'البريد وكلمة المرور', google: 'Google', github: 'GitHub', linkedin: 'LinkedIn' };
  const provider = user ? providers[user.provider] || 'مزود تسجيل الدخول' : '';
  return <div dir="rtl" className="login-page profile-page"><UnsavedNavigation active={() => draftState.dirty || draftState.busy} busy={draftState.busy} />
    <main className="profile-layout"><header className="profile-page-heading"><div><h1 ref={heading} tabIndex={-1}>ملفك المهني</h1><p>معلوماتك ومهاراتك وإعدادات حسابك، في مكان واحد.</p></div>{user && !editing && <button type="button" className="profile-primary" onClick={() => { setEditing(true); setSuccess(''); }}><PencilSquareIcon aria-hidden="true" />تعديل البيانات</button>}</header>
      {loading ? <p role="status" className="profile-load-status">جارٍ تحميل ملفك الشخصي…</p> : error || !user ? <div className="profile-error-banner"><p role="alert">{error || 'تعذر تحميل الملف الشخصي.'}</p><button type="button" className="profile-secondary" onClick={() => setAttempt(value => value + 1)}>إعادة المحاولة</button></div> : <>
        <div className="profile-overview"><ProfileHeader key={user.avatar || user.avatar_url || 'initials'} user={user} /><ScoreCard score={user.score ?? 0} /></div>
        <nav className="profile-links" aria-label="روابط الحساب"><Link to="/support">الدعم والمساعدة</Link>{user.role === 'seeker' && <><Link to="/cv">سيرتي الذاتية</Link><Link to="/applications">تقديماتي</Link></>}{user.role === 'company' && <Link to="/admin/company-dashboard">لوحة الشركة</Link>}{user.role === 'admin' && <Link to="/admin/dashboard">لوحة الإدارة</Link>}</nav>
        {success && <p role="status" className="profile-success">{success}</p>}
        {editing ? <ProfileEditor user={user} onSaved={saved} onStateChange={editorState} onCancel={closeEditor} /> : <>
          {!user.hasCompletedQuestions && <p className="profile-complete-note">ملفك جاهز للتعديل، ويمكنك أيضًا <Link to="/questions">استكمال بياناتك خطوة بخطوة</Link>.</p>}
          <div className="profile-details-grid"><ProfileSection title="المعلومات الشخصية"><dl className="profile-info-grid"><InfoItem label="الاسم الكامل" value={user.name || 'لم تضف اسمًا'} /><InfoItem label="العمر" value={onboarding?.age ? `${onboarding.age} سنة` : 'لم تضف العمر'} /><InfoItem label="المدينة" value={onboarding?.city || 'لم تضف المدينة'} /></dl></ProfileSection>
          <ProfileSection title="التعلّم"><dl className="profile-info-grid"><InfoItem label="الجامعة أو جهة التعلّم" value={onboarding?.university || 'لم تضف جهة تعلّم'} /><InfoItem label="التخصص" value={onboarding?.major || 'لم تضف تخصصًا'} /></dl></ProfileSection></div>
          <ProfileSection title="لغات البرمجة"><div className="profile-language-tags">{onboarding?.programmingLanguages?.length ? onboarding.programmingLanguages.map(language => <span key={language} dir="auto">{language}</span>) : <p>لم تضف لغات بعد. يمكنك إضافتها من «تعديل البيانات».</p>}</div></ProfileSection>
          <ProfileSection title="الاهتمامات المهنية"><dl className="profile-info-grid"><InfoItem label="المسمى المهني" value={onboarding?.jobTitle || 'لم تضف مسمى مهنيًا'} /><InfoItem label="سنوات الخبرة" value={onboarding?.experienceYears || 'لم تحدد الخبرة'} /><InfoItem label="الاهتمام المهني" value={onboarding?.jobInterest || 'لم تحدد مجالًا'} /><InfoItem label="البحث عن عمل" value={onboarding?.lookingForJob ? 'أبحث عن فرصة عمل' : 'لم تفعّل البحث عن عمل'} /></dl></ProfileSection>
          <ProfileSection title="بيانات الحساب"><dl className="profile-info-grid"><InfoItem label="البريد الإلكتروني" value={user.email} /><InfoItem label="رقم الهاتف" value={user.phone || 'لم تضف رقم هاتف'} /><InfoItem label="طريقة تسجيل الدخول" value={provider} /></dl></ProfileSection>
          <ProfileSection title="أمان الحساب">{user.provider === 'local' ? <details className="profile-password"><summary>تغيير كلمة المرور</summary><div><ChangePasswordForm onChanged={setUser} /></div></details> : <p className="profile-hint">حسابك مرتبط بـ {provider}. يمكنك إدارة كلمة المرور من حسابك لدى مزود تسجيل الدخول.</p>}</ProfileSection>
        </>}
      </>}
    </main></div>;
}
