import { CITIES } from "../../constants/questionsData";
import QuestionError from "./QuestionError";
import type { QuestionsForm } from "../../types/questions";
type Props = { form: QuestionsForm;
  setForm: React.Dispatch<React.SetStateAction<QuestionsForm>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
};
function PersonalStep({ form, setForm, error, setError }: Props) {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        معلوماتك الشخصية
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        أخبرنا عن نفسك
      </p>
      <QuestionError error={error} />
      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          الاسم الكامل
        </label>
        <input type="text" value={form.fullName}onChange={(event) => {
            setForm({ ...form, fullName: event.target.value });
            setError("");
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          العمر
        </label>
        <input type="number" value={form.age} min="10" max="80"
          onChange={(event) => {
            setForm({ ...form, age: event.target.value });
            setError("");
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-2 text-gray-800 font-medium">
          المدينة
        </label>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <button key={city} onClick={() => {
                setForm({ ...form, city });
                setError("");
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                form.city === city
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default PersonalStep;