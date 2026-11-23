import { uniqueLanguages } from './languages';
import type { QuestionsForm, QuestionStep, QuestionErrors, QuestionFieldName } from '../types/questions';
import type { UserProfile } from '../types/user';
import { returnPath } from '../../../shared/navigation';
export const QUESTION_STEPS = [
  { title: 'معلوماتك الشخصية', short: 'شخصية', description: 'أضف اسمك وعمرك ومدينتك كما تريد أن تظهر في ملفك.', fields: ['fullName', 'age', 'city'] },
  { title: 'تعليمك وتعلّمك', short: 'التعلّم', description: 'هذه البيانات اختيارية. يمكنك إضافة الجامعة أو جهة تدريب، أو المتابعة دونها.', fields: ['university', 'major'] },
  { title: 'لغات البرمجة', short: 'اللغات', description: 'اختر ما تعرفه أو تتعلّمه. إذا كنت في البداية، يمكنك المتابعة دون اختيار.', fields: ['programmingLanguages'] },
  { title: 'اهتماماتك المهنية', short: 'مهنية', description: 'حدد وضعك الحالي والمجال الذي تهتم بالعمل فيه، ثم راجع بياناتك واحفظها.', fields: ['jobTitle', 'experienceYears', 'lookingForJob', 'jobInterest'] },
] as const;
const text = (value: unknown): string => typeof value === 'string' ? value : '';
export function normalizeQuestionAge(value: string): string {
  return value.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)).trim();
}
export function questionsFromProfile(profile: UserProfile): QuestionsForm {
  const details = profile.onboardingData;
  return { fullName: text(profile.name) || text(details?.fullName), age: details?.age == null ? '' : String(details.age), city: text(details?.city),
    university: text(details?.university), major: text(details?.major), programmingLanguages: Array.isArray(details?.programmingLanguages) ? uniqueLanguages(details.programmingLanguages.filter(value => typeof value === 'string' && value.trim())) : [],
    jobTitle: text(details?.jobTitle), experienceYears: text(details?.experienceYears), lookingForJob: details?.lookingForJob === true, jobInterest: text(details?.jobInterest) };
}
export function validateQuestionsStep(step: QuestionStep, form: QuestionsForm): QuestionErrors {
  const errors: QuestionErrors = {};
  const bounded = (field: Exclude<QuestionFieldName, 'programmingLanguages' | 'lookingForJob'>, limit: number, required = false) => {
    const value = form[field].trim();
    if (required && !value) errors[field] = 'هذا الحقل مطلوب.';
    else if (value.length > limit) errors[field] = `استخدم ${limit} حرفًا أو أقل.`;
  };
  if (step === 1) {
    bounded('fullName', 200, true);
    const age = normalizeQuestionAge(form.age);
    if (!/^[0-9]{1,3}$/.test(age) || Number(age) < 1 || Number(age) > 150) errors.age = 'أدخل عمرًا صحيحًا بين ١ و١٥٠.';
    bounded('city', 100, true);
  } else if (step === 2) { bounded('university', 200); bounded('major', 200); }
  else if (step === 3) {
    if (form.programmingLanguages.length > 50 || form.programmingLanguages.some(value => typeof value !== 'string' || !value.trim() || value.trim().length > 80)) errors.programmingLanguages = 'راجع أسماء اللغات. يمكنك اختيار ٥٠ لغة كحد أقصى.';
  } else { bounded('jobTitle', 300, true); bounded('experienceYears', 100, true); bounded('jobInterest', 300, true); }
  return errors;
}
export function firstQuestionsError(form: QuestionsForm): { step: QuestionStep; errors: QuestionErrors } | null {
  for (const step of [1, 2, 3, 4] as const) { const errors = validateQuestionsStep(step, form); if (Object.keys(errors).length) return { step, errors }; }
  return null;
}
export function questionsPayload(form: QuestionsForm) {
  return { fullName: form.fullName.trim(), age: Number(normalizeQuestionAge(form.age)), city: form.city.trim(), university: form.university.trim(), major: form.major.trim(),
    programmingLanguages: uniqueLanguages(form.programmingLanguages), jobTitle: form.jobTitle.trim(), experienceYears: form.experienceYears.trim(), lookingForJob: form.lookingForJob, jobInterest: form.jobInterest.trim() };
}
export function validQuestionsProfile(value: unknown, accountId: string): value is UserProfile {
  if (!value || typeof value !== 'object' || !('_id' in value) || value._id !== accountId || !('name' in value) || typeof value.name !== 'string' || !('email' in value) || typeof value.email !== 'string') return false;
  return 'role' in value && typeof value.role === 'string' && ['seeker', 'company', 'admin'].includes(value.role)
    && 'hasCompletedQuestions' in value && typeof value.hasCompletedQuestions === 'boolean'
    && (!('onboardingData' in value) || (!!value.onboardingData && typeof value.onboardingData === 'object' && !Array.isArray(value.onboardingData)));
}
export function questionsDestination(user: UserProfile, from: unknown): string {
  return user.role === 'admin' ? '/admin/dashboard' : user.role === 'company' ? '/admin/company-dashboard' : returnPath({ from }) || '/home';
}
export function validateStep(step: number, form: QuestionsForm): string | null {
  return Object.values(validateQuestionsStep(step as QuestionStep, form))[0] || null;
}
