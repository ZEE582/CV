import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import type { InputHTMLAttributes } from 'react';
import type { RecoveryFieldName } from '../validation/passwordRecoveryValidation';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  field: RecoveryFieldName; label: string; error?: string; hint?: string; revealed?: boolean; onToggle?: () => void;
}
export default function RecoveryField({ field, label, error, hint, revealed, onToggle, ...props }: Props) {
  const id = 'recovery-' + field;
  return <div className="recovery-field" data-invalid={!!error}>
    <label htmlFor={id}>{label}</label>
    <div className="recovery-control">
      <input {...props} id={id} name={field} required aria-invalid={!!error} aria-describedby={error ? id + '-error' : hint ? id + '-hint' : undefined}
        className={'login-input' + (onToggle ? ' login-password-input' : '') + (field === 'code' ? ' recovery-code' : '')} />
      {onToggle && <button type="button" className="login-visibility" disabled={props.disabled} onClick={onToggle} aria-label={(revealed ? 'إخفاء ' : 'إظهار ') + label} aria-pressed={revealed}>
        {revealed ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>}
    </div>
    {error ? <p id={id + '-error'} className="recovery-field-error" role="alert">{error}</p> : hint && <p id={id + '-hint'} className="recovery-hint">{hint}</p>}
  </div>;
}
