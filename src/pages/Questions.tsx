import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#",
  "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart",
  "R", "Scala", "HTML/CSS", "SQL", "Bash",
];

const JOB_INTERESTS = [
  "تطوير الواجهة الأمامية (Frontend)",
  "تطوير الخلفية (Backend)",
  "تطوير تطبيقات الموبايل",
  "الذكاء الاصطناعي وتعلم الآلة",
  "أمن المعلومات (Cybersecurity)",
  "DevOps والبنية التحتية",
  "علم البيانات (Data Science)",
  "تطوير الألعاب",
  "تطوير الويب الكامل (Full Stack)",
];

const JOB_TITLES = [
  "طالب جامعي",
  "مطور مبتدئ (Junior)",
  "مطور متوسط (Mid-level)",
  "مطور متقدم (Senior)",
  "فريلانسر",
  "أبحث عن عمل",
];

const EXPERIENCE_YEARS = [
  "أقل من سنة",
  "1-2 سنة",
  "3-5 سنوات",
  "أكثر من 5 سنوات",
];

const CITIES = [
  "رام الله", "نابلس", "الخليل", "جنين", "طولكرم",
  "قلقيلية", "أريحا", "بيت لحم", "سلفيت", "طوباس",
  "غزة", "القدس", "أخرى",
];

function Questions() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // خطوة 1 — معلومات شخصية
    fullName: "",
    age: "",
    city: "",
    // خطوة 2 — معلومات أكاديمية
    university: "",
    major: "",
    // خطوة 3 — لغات البرمجة
    programmingLanguages: [] as string[],
    // خطوة 4 — معلومات مهنية
    jobTitle: "",
    experienceYears: "",
    lookingForJob: false,
    jobInterest: "",
  });

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      programmingLanguages: prev.programmingLanguages.includes(lang)
        ? prev.programmingLanguages.filter((l) => l !== lang)
        : [...prev.programmingLanguages, lang],
    }));
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.fullName.trim()) { setError("يرجى إدخال اسمك الكامل"); return; }
      if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 10 || Number(form.age) > 80) {
        setError("يرجى إدخال عمر صحيح"); return;
      }
      if (!form.city) { setError("يرجى اختيار مدينتك"); return; }
    }
    if (step === 2) {
      if (!form.university.trim() || !form.major.trim()) {
        setError("يرجى تعبئة جميع الحقول"); return;
      }
    }
    if (step === 3) {
      if (form.programmingLanguages.length === 0) {
        setError("اختر لغة برمجة واحدة على الأقل"); return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
  setError("");

  if (!form.jobTitle || !form.experienceYears || !form.jobInterest) {
    setError("يرجى تعبئة جميع الحقول");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    const response = await fetch("http://localhost:3000/api/user/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

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

  const totalSteps = 4;
  const progress = Math.round((step / totalSteps) * 100);

  const stepLabels = ["معلومات شخصية", "أكاديمية", "لغات البرمجة", "مهنية"];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">الخطوة {step} من {totalSteps}</span>
            <span className="text-sm font-medium text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {stepLabels.map((label, i) => (
              <span key={i} className={`text-xs ${step === i + 1 ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">

          {/* ─── خطوة 1: معلومات شخصية ─── */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">معلوماتك الشخصية</h2>
              <p className="text-sm text-gray-500 mb-6">أخبرنا عن نفسك</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

              <div className="mb-4">
                <label className="block mb-2 text-gray-800 font-medium">الاسم الكامل</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => { setForm({ ...form, fullName: e.target.value }); setError(""); }}
                  placeholder=""
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-gray-800 font-medium">العمر</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => { setForm({ ...form, age: e.target.value }); setError(""); }}
                  placeholder=""
                  min="10"
                  max="80"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-gray-800 font-medium">المدينة</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => { setForm({ ...form, city }); setError(""); }}
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
          )}

          {/* ─── خطوة 2: معلومات أكاديمية ─── */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">معلوماتك الأكاديمية</h2>
              <p className="text-sm text-gray-500 mb-6">أخبرنا عن مسيرتك التعليمية</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

              <div className="mb-4">
                <label className="block mb-2 text-gray-800 font-medium">الجامعة</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => { setForm({ ...form, university: e.target.value }); setError(""); }}
                  placeholder="مثال: جامعة النجاح"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
                />
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-gray-800 font-medium">التخصص</label>
                <input
                  type="text"
                  value={form.major}
                  onChange={(e) => { setForm({ ...form, major: e.target.value }); setError(""); }}
                  placeholder="مثال: هندسة البرمجيات"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-right"
                />
              </div>
            </>
          )}

          {/* ─── خطوة 3: لغات البرمجة ─── */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">لغات البرمجة</h2>
              <p className="text-sm text-gray-500 mb-6">اختر اللغات التي تعرفها أو تعمل بها</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      form.programmingLanguages.includes(lang)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {form.programmingLanguages.length > 0 && (
                <p className="text-xs text-gray-400 mt-4">اخترت {form.programmingLanguages.length} لغة</p>
              )}
            </>
          )}

          {/* ─── خطوة 4: معلومات مهنية ─── */}
          {step === 4 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">معلوماتك المهنية</h2>
              <p className="text-sm text-gray-500 mb-6">أخبرنا عن وضعك المهني</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

              <div className="mb-4">
                <label className="block mb-2 text-gray-800 font-medium">وظيفتك الحالية</label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TITLES.map((title) => (
                    <button
                      key={title}
                      onClick={() => { setForm({ ...form, jobTitle: title }); setError(""); }}
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
                <label className="block mb-2 text-gray-800 font-medium">سنوات الخبرة</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => { setForm({ ...form, experienceYears: year }); setError(""); }}
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
                <label className="block mb-2 text-gray-800 font-medium">هل تبحث عن وظيفة الآن؟</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm({ ...form, lookingForJob: true })}
                    className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                      form.lookingForJob
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                        : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setForm({ ...form, lookingForJob: false })}
                    className={`flex-1 py-2.5 text-sm rounded-lg border transition-all ${
                      !form.lookingForJob
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                        : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    لا
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <label className="block mb-2 text-gray-800 font-medium">ما الذي تحب أن تعمل فيه؟</label>
                <div className="space-y-2">
                  {JOB_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => { setForm({ ...form, jobInterest: interest }); setError(""); }}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border text-right transition-all ${
                        form.jobInterest === interest
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                          : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* أزرار التنقل */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 font-bold hover:bg-gray-50 transition"
              >
                السابق
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
              >
                التالي
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
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