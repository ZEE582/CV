import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/questioncomp/ProgressBar";
import PersonalStep from "../components/questioncomp/PersonalStep";
import AcademicStep from "../components/questioncomp/AcademicStep";
import LanguagesStep from "../components/questioncomp/LanguagesStep";
import ProfessionalStep from "../components/questioncomp/ProfessionalStep";
import { submitQuestions } from "../services/questionsService";
import type { QuestionsForm } from "../types/questions";
function Questions() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<QuestionsForm>({
    fullName: "", age: "", city: "", university: "", major: "", programmingLanguages: [], jobTitle: "",
    experienceYears: "",lookingForJob: false,jobInterest: "",
  });
  const totalSteps = 4;
  const validateCurrentStep = () => {
    if (step === 1) {
      if (!form.fullName.trim()) return "يرجى إدخال اسمك الكامل";
      if (!form.age || isNaN(Number(form.age))) return "يرجى إدخال عمر صحيح";
      if (!form.city) return "يرجى اختيار مدينتك";
    }
    if (step === 2) {
      if (!form.university.trim() || !form.major.trim()) {
        return "يرجى تعبئة جميع الحقول";
      }
    }
    if (step === 3) {
      if (form.programmingLanguages.length === 0) {
        return "اختر لغة برمجة واحدة على الأقل";
      }
    }
    if (step === 4) {
      if (!form.jobTitle || !form.experienceYears || !form.jobInterest) {
        return "يرجى تعبئة جميع الحقول";
      }
    } return "";
  };
  const handleNext = () => {
    setError("");
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep((current) => current + 1);
  };
  const handleSubmit = async () => {
    setError("");
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { response, data } = await submitQuestions(form);
      if (!response.ok) {
        setError(data.message || "حدث خطأ أثناء حفظ البيانات");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/home");
    } catch {
      setError("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div dir="rtl"className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <ProgressBar step={step} totalSteps={totalSteps} />
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
          {step === 1 && ( <PersonalStep form={form}setForm={setForm}error={error} setError={setError}/>
          )}
          {step === 2 && ( <AcademicStep form={form} setForm={setForm}  error={error} setError={setError}/>
          )}
          {step === 3 && ( <LanguagesStep form={form}  setForm={setForm}   error={error}   setError={setError} />
          )}
          {step === 4 && (<ProfessionalStep form={form} setForm={setForm} error={error}setError={setError} />
          )}
          <div className="flex gap-3 mt-8">
            {step > 1 && (<button onClick={() => setStep((current) => current - 1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition"
              >
                السابق
              </button>
            )}
            {step < totalSteps ? (<button onClick={handleNext}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
              >
                التالي
              </button>
            ) : ( <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? "جاري الحفظ..." : "إنهاء وابدأ 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Questions;