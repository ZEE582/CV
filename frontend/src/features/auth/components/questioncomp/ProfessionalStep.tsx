import type { QuestionStepProps } from '../../types/questions';
import { JOB_TITLES, EXPERIENCE_YEARS, JOB_INTERESTS } from '../../constants/questionsData';
import QuestionField from './QuestionField';
export default function ProfessionalStep(props: QuestionStepProps) {
  return <div className="questions-fields">
    <QuestionField {...props} field="jobTitle" label="وضعك المهني الحالي" required maxLength={300} choices={JOB_TITLES} />
    <QuestionField {...props} field="experienceYears" label="الخبرة العملية" required maxLength={100} choices={EXPERIENCE_YEARS} />
    <QuestionField {...props} field="jobInterest" label="المجال الذي تهتم به" required maxLength={300} choices={JOB_INTERESTS} />
    <label className="questions-looking"><input id="questions-lookingForJob" name="lookingForJob" type="checkbox" checked={props.form.lookingForJob} onChange={event => props.update('lookingForJob', event.target.checked)} /><span>أبحث عن فرصة عمل حاليًا</span></label>
  </div>;
}
