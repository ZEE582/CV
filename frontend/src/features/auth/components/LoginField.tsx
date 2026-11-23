import type { InputHTMLAttributes } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { LoginFieldName } from '../validation/authValidation';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  field: LoginFieldName; label: string; error?: string; revealed?: boolean; capsLock?: boolean;
  onToggle?: () => void;
}
export default function LoginField({ field, label, error, revealed, capsLock, onToggle, ...props }: Props) {
  const id = 'login-' + field;
  const describedBy = [error && id + '-error', capsLock && id + '-caps'].filter(Boolean).join(' ');
  return <div className="login-field" data-invalid={!!error}>
    <label htmlFor={id}>{label}</label>
    <div className="login-field-control">
      <input {...props} id={id} name={field} required aria-invalid={!!error} aria-describedby={describedBy || undefined}
        className={'login-input' + (onToggle ? ' login-password-input' : '')} />
      {onToggle && <button type="button" className="login-visibility" onClick={onToggle} disabled={props.disabled}
        aria-label={revealed ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} aria-pressed={revealed}>
        {revealed ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>}
    </div>
    {error && <p id={id + '-error'} className="login-field-error" role="alert">{error}</p>}
    {capsLock && <p id={id + '-caps'} className="login-caps" role="status">مفتاح Caps Lock مفعّل.</p>}
  </div>;
}
