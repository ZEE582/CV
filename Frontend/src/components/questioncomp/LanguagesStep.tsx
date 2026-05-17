import { LANGUAGES } from "../../constants/questionsData";
import QuestionError from "./QuestionError";
import type { QuestionsForm } from "../../types/questions";
type Props = {
  form: QuestionsForm;
  setForm: React.Dispatch<React.SetStateAction<QuestionsForm>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
};
function LanguagesStep({ form, setForm, error, setError }: Props) {
  const toggleLanguage = (language: string) => {
    setForm((previous) => ({
      ...previous,
      programmingLanguages: previous.programmingLanguages.includes(language)
        ? previous.programmingLanguages.filter((item) => item !== language)
        : [...previous.programmingLanguages, language],
    }));
    setError("");
  };
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        لغات البرمجة
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        اختر اللغات التي تعرفها أو تعمل بها
      </p>
      <QuestionError error={error} />
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((language) => (
          <button
            key={language}
            onClick={() => toggleLanguage(language)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              form.programmingLanguages.includes(language)
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {language}
          </button>
        ))}
      </div>
      {form.programmingLanguages.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          اخترت {form.programmingLanguages.length} لغة
        </p>
      )}
    </>
  );
}

export default LanguagesStep;