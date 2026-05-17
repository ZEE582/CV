import {JOB_TITLES,EXPERIENCE_YEARS,JOB_INTERESTS,} from "../../constants/questionsData";
import QuestionError from "./QuestionError";
import type { QuestionsForm } from "../../types/questions";
type Props = {
  form: QuestionsForm;
  setForm: React.Dispatch<React.SetStateAction<QuestionsForm>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
};
function ProfessionalStep({ form, setForm, error, setError }: Props) {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        معلوماتك المهنية
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        أخبرنا عن وضعك المهني
      </p>
      <QuestionError error={error} />

      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          وظيفتك الحالية
        </label>
        <div className="grid grid-cols-2 gap-2">
          {JOB_TITLES.map((title) => (
            <button
              key={title}
              onClick={() => {
                setForm({ ...form, jobTitle: title });
                setError("");
              }}
              className={`px-3 py-2.5 text-sm rounded-lg border text-right transition-all ${
                form.jobTitle === title
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                  : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          سنوات الخبرة
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EXPERIENCE_YEARS.map((year) => (
            <button
              key={year}
              onClick={() => {
                setForm({ ...form, experienceYears: year });
                setError("");
              }}
              className={`px-3 py-2.5 text-sm rounded-lg border text-right transition-all ${
                form.experienceYears === year
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                  : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          هل تبحث عن وظيفة الآن؟
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setForm({ ...form, lookingForJob: true })}
            className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${ form.lookingForJob
                ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium": "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
            }`}
          >
            نعم
          </button>
          <button onClick={() => setForm({ ...form, lookingForJob: false })}
            className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${ !form.lookingForJob
                ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium" : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
            }`}
          >
            لا
          </button>
        </div>
      </div>
      <div className="mb-2">
        <label className="block mb-2 text-gray-800 font-medium">
          ما الذي تحب أن تعمل فيه؟
        </label>
        <div className="space-y-2">
          {JOB_INTERESTS.map((interest) => (
            <button key={interest} onClick={() => {
                setForm({ ...form, jobInterest: interest });
                setError("");
              }}
              className={`w-full px-4 py-2.5 text-sm rounded-lg border text-right transition-all ${
                form.jobInterest === interest
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium": "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default ProfessionalStep;