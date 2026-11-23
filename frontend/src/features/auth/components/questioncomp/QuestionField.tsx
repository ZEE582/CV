import type { QuestionStepProps, QuestionsForm } from '../../types/questions';
type TextField = Exclude<keyof QuestionsForm, 'programmingLanguages' | 'lookingForJob'>;
interface Props extends QuestionStepProps {
  field: TextField; label: string; maxLength: number; required?: boolean;
  hint?: string; choices?: string[]; suggestions?: string[]; autoComplete?: string;
}
export default function QuestionField({ field, label, maxLength, required, hint, choices, suggestions, autoComplete, form, errors, update }: Props) {
  const id = 'questions-' + field; const error = errors[field];
  const describedBy = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ') || undefined;
  const common = { id, name: field, value: form[field], required, 'aria-invalid': !!error, 'aria-describedby': describedBy,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update(field, event.target.value) };
  const options = choices ? [...new Set([...choices, ...(form[field] ? [form[field]] : [])])] : [];
  return <div className="questions-field" data-invalid={!!error}>
    <label htmlFor={id}>{label}{!required && <span className="questions-optional">اختياري</span>}</label>
    {choices ? <select {...common}><option value="">اختر {label}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>
      : <input {...common} type="text" maxLength={maxLength} autoComplete={autoComplete} inputMode={field === 'age' ? 'numeric' : undefined} list={suggestions ? id + '-options' : undefined} />}
    {suggestions && <datalist id={id + '-options'}>{suggestions.map(option => <option key={option} value={option} />)}</datalist>}
    {hint && <p id={id + '-hint'} className="questions-hint">{hint}</p>}
    {error && <p id={id + '-error'} className="questions-error">{error}</p>}
  </div>;
}
