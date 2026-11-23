import type { RefObject } from 'react';
import { normalizeVerificationCode } from '../../validation/verification';
type Props = { value: string; inputRef: RefObject<HTMLInputElement>; disabled: boolean; error: string; onChange: (code: string) => void };
export default function CodeInputs({ value, inputRef, disabled, error, onChange }: Props) {
  return <div className="verify-code-field" data-invalid={!!error}>
    <label htmlFor="verification-code">رمز التأكيد (٥ أرقام)</label>
    <input ref={inputRef} id="verification-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" dir="ltr"
      maxLength={32} required value={value} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? 'verification-code-error' : 'verification-code-hint'}
      onChange={event => onChange(normalizeVerificationCode(event.target.value))} className="verify-code-input" placeholder="— — — — —" />
    {error ? <p id="verification-code-error" className="verify-field-error" role="alert">{error}</p> : <p id="verification-code-hint" className="verify-field-hint">يمكنك كتابة الرمز أو لصقه كاملًا، بالأرقام العربية أو الإنجليزية.</p>}
  </div>;
}
