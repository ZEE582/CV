export interface QuestionsForm {
  fullName: string; age: string; city: string; university: string; major: string;
  programmingLanguages: string[]; jobTitle: string; experienceYears: string; lookingForJob: boolean; jobInterest: string;
}
export type QuestionStep = 1 | 2 | 3 | 4;
export type QuestionFieldName = keyof QuestionsForm;
export type QuestionErrors = Partial<Record<QuestionFieldName, string>>;
export interface QuestionStepProps {
  form: QuestionsForm; errors: QuestionErrors;
  update: <K extends QuestionFieldName>(field: K, value: QuestionsForm[K]) => void;
}
