import QuestionError from "./QuestionError";
import type { QuestionsForm } from "../../types/questions";

type Props = {
  form: QuestionsForm;
  setForm: React.Dispatch<React.SetStateAction<QuestionsForm>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
};

function AcademicStep({ form, setForm, error, setError }: Props) {
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        معلوماتك الأكاديمية
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        أخبرنا عن مسيرتك التعليمية
      </p>

      <QuestionError error={error} />

      <div className="mb-4">
        <label className="block mb-2 text-gray-800 font-medium">
          الجامعة
        </label>

        <input
          type="text"
          value={form.university}
          onChange={(event) => {
            setForm({ ...form, university: event.target.value });
            setError("");
          }}
          placeholder="مثال: جامعة النجاح"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-2 text-gray-800 font-medium">
          التخصص
        </label>

        <input
          type="text"
          value={form.major}
          onChange={(event) => {
            setForm({ ...form, major: event.target.value });
            setError("");
          }}
          placeholder="مثال: هندسة البرمجيات"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
        />
      </div>
    </>
  );
}

export default AcademicStep;