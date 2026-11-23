import type { QuestionStepProps } from '../../types/questions';
import QuestionField from './QuestionField';
export default function AcademicStep(props: QuestionStepProps) {
  return <div className="questions-fields">
    <QuestionField {...props} field="university" label="الجامعة أو جهة التعلّم" maxLength={200} autoComplete="organization" hint="يمكنك كتابة جهة تدريب أو ترك الحقل فارغًا." />
    <QuestionField {...props} field="major" label="التخصص أو مجال الدراسة" maxLength={200} />
  </div>;
}
