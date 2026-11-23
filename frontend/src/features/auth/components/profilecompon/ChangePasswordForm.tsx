import { useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../../../shared/AuthContext';
import { changePassword } from '../../services/profileService';
import { validatePassword } from '../../validation/profileValidation';
import type { UserProfile } from '../../types/user';

export default function ChangePasswordForm({ onChanged }: { onChanged: (user: UserProfile) => void }) {
  const { completeLogin } = useAuth();
  const [values, setValues] = useState({ current: '', password: '', confirmation: '' });
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const busy = useRef(false);
  const id = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setError(''); setSuccess('');
    const validation = validatePassword(values.current, values.password, values.confirmation);
    if (validation) { setError(validation); return; }
    busy.current = true; setSaving(true);
    try {
      const result = await changePassword(values.current, values.password);
      completeLogin(result.token, result.user); onChanged(result.user);
      setValues({ current: '', password: '', confirmation: '' }); setVisible(false); setSuccess(result.message);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'تعذر تغيير كلمة المرور'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <form onSubmit={submit} aria-label="تغيير كلمة المرور" className="space-y-4">
    <p className="text-sm text-gray-600">استخدم 8 أحرف على الأقل. بعد الحفظ تنتهي الجلسات السابقة، وتبقى جلستك الحالية متصلة.</p>
    <fieldset disabled={saving} className="space-y-4 min-w-0">
      {([
        ['current', 'كلمة المرور الحالية', 'current-password'], ['password', 'كلمة المرور الجديدة', 'new-password'], ['confirmation', 'تأكيد كلمة المرور الجديدة', 'new-password'],
      ] as const).map(([key, label, autoComplete]) => <div key={key}>
        <label htmlFor={id + '-' + key} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input id={id + '-' + key} name={key} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required maxLength={128}
          minLength={key === 'current' ? undefined : 8} value={values[key]} dir="ltr"
          onChange={event => { setValues(current => ({ ...current, [key]: event.target.value })); setError(''); setSuccess(''); }}
          className="w-full min-w-0 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>)}
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />إظهار كلمات المرور</label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl break-words">{error}</p>}
    {success && <p role="status" className="text-sm text-green-800 bg-green-50 p-3 rounded-xl">{success}</p>}
    <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl disabled:opacity-60">{saving ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}</button>
  </form>;
}
