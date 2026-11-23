import type { QuestionStepProps } from '../../types/questions';
import { CITIES } from '../../constants/questionsData';
import QuestionField from './QuestionField';
export default function PersonalStep(props: QuestionStepProps) {
  return <div className="questions-fields">
    <QuestionField {...props} field="fullName" label="الاسم الكامل" required maxLength={200} autoComplete="name" />
    <div className="questions-personal-row">
      <QuestionField {...props} field="age" label="العمر" required maxLength={6} hint="بالسنوات، من ١ إلى ١٥٠." />
      <QuestionField {...props} field="city" label="المدينة" required maxLength={100} autoComplete="address-level2" suggestions={CITIES.filter(city => city !== 'أخرى')} hint="اختر مدينة أو اكتب اسم مدينتك." />
    </div>
  </div>;
}
