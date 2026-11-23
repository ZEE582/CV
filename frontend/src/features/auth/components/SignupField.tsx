import type { InputHTMLAttributes } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import type { SignupFieldName } from "../validation/signupValidation";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  field: SignupFieldName;
  label: string;
  error?: string;
  hint?: string;
  revealed?: boolean;
  onToggleVisibility?: () => void;
}
export default function SignupField({ field, label, error, hint, revealed, onToggleVisibility, ...inputProps }: Props) {
  const id = "signup-" + field;
  const description = [hint && !error ? id + "-hint" : "", error ? id + "-error" : ""].filter(Boolean).join(" ");
  return (
    <div className="signup-field" data-invalid={!!error}>
      <label htmlFor={id}>{label}</label>
      <div className="signup-field-control">
        <input {...inputProps} id={id} name={field} required aria-invalid={!!error} aria-describedby={description || undefined} className={onToggleVisibility ? "signup-input signup-input-password" : "signup-input"} />
        {onToggleVisibility && (
          <button type="button" className="signup-password-toggle" disabled={inputProps.disabled} onClick={onToggleVisibility}
            aria-label={(revealed ? "إخفاء " : "إظهار ") + (field === "confirmPassword" ? "تأكيد كلمة المرور" : "كلمة المرور")} aria-pressed={revealed}>
            {revealed ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && !error && <p id={id + "-hint"} className="signup-field-hint">{hint}</p>}
      {error && <p id={id + "-error"} className="signup-field-error" role="alert">{error}</p>}
    </div>
  );
}
