import type { QuestionStepProps } from '../../types/questions';
import LanguagePicker from '../LanguagePicker';
export default function LanguagesStep({ form, update, errors }: QuestionStepProps) {
  return <fieldset className="questions-languages" id="questions-programmingLanguages" tabIndex={-1} aria-describedby={errors.programmingLanguages ? 'questions-programmingLanguages-error' : undefined}>
    <legend>اللغات التي تعرفها أو تتعلّمها <span className="questions-optional">اختياري</span></legend>
    <LanguagePicker selected={form.programmingLanguages} onChange={value => update('programmingLanguages', value)} />
    {errors.programmingLanguages && <p className="questions-error" id="questions-programmingLanguages-error">{errors.programmingLanguages}</p>}
  </fieldset>;
}
