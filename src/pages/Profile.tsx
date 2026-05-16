import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  provider: string;
  score: number; // النقاط المتراكمة من الألعاب
  onboardingData: {
    fullName: string;
    age: number;
    city: string;
    university: string;
    major: string;
    programmingLanguages: string[];
    jobTitle: string;
    experienceYears: string;
    lookingForJob: boolean;
    jobInterest: string;
  };
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUser(data.user);
      } catch {
        console.error("فشل تحميل البروفايل");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-400">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-red-500">تعذر تحميل البروفايل</p>
      </div>
    );
  }

  const d = user.onboardingData;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* زر الرجوع */}
        <button
          onClick={() => navigate("/home")}
          className="mb-6 text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          ← رجوع للرئيسية
        </button>

        {/* بطاقة رأس البروفايل */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4 flex items-center gap-5">
          {/* صورة البروفايل */}
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-indigo-600">
                {(d.fullName || user.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* الاسم والإيميل */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{d.fullName || user.name || "—"}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            {d.city && <p className="text-sm text-gray-400 mt-0.5">📍 {d.city}</p>}
          </div>
        </div>

        {/* ── بطاقة النقاط ── */}
        {/*
          هاي الخانة بتعرض مجموع النقاط اللي كسبها المستخدم من الألعاب.
          القيمة بتيجي من الـ API عبر حقل score في user object.
          زميلتك رح تربطها بصفحة الألعاب عبر:
            PATCH /api/user/score  { points: <عدد النقاط> }
        */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-4">🏆 نقاطي</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">مجموع النقاط المكتسبة من الألعاب</p>
              <p className="text-4xl font-extrabold text-indigo-600">
                {(user.score ?? 0).toLocaleString()}
              </p>
            </div>
            {/* Badge يتغير حسب مستوى النقاط */}
            <ScoreBadge score={user.score ?? 0} />
          </div>
        </div>

        {/* المعلومات الشخصية */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-4">المعلومات الشخصية</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="العمر" value={d.age ? `${d.age} سنة` : "—"} />
            <InfoItem label="المدينة" value={d.city || "—"} />
          </div>
        </div>

        {/* المعلومات الأكاديمية */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-4">المعلومات الأكاديمية</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="الجامعة" value={d.university || "—"} />
            <InfoItem label="التخصص" value={d.major || "—"} />
          </div>
        </div>

        {/* لغات البرمجة */}
        {d.programmingLanguages?.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-4">لغات البرمجة</h2>
            <div className="flex flex-wrap gap-2">
              {d.programmingLanguages.map((lang) => (
                <span
                  key={lang}
                  className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-lg border border-indigo-200"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* المعلومات المهنية */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-4">المعلومات المهنية</h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="الوظيفة" value={d.jobTitle || "—"} />
            <InfoItem label="سنوات الخبرة" value={d.experienceYears || "—"} />
            <InfoItem label="يبحث عن وظيفة" value={d.lookingForJob ? "نعم ✅" : "لا"} />
            <InfoItem label="الاهتمام المهني" value={d.jobInterest || "—"} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── ScoreBadge ────────────────────────────────────────────────────────────────
/**
 * يعرض badge يتغير لونه ونصه حسب مستوى النقاط.
 * المستويات:
 *   0        → مبتدئ
 *   1–499    → متدرب
 *   500–1999 → محترف
 *   2000+    → خبير
 *
 * @param {{ score: number }} props
 */
function ScoreBadge({ score }: { score: number }) {
  const level =
    score === 0
      ? { label: "مبتدئ", color: "bg-gray-100 text-gray-500" }
      : score < 500
      ? { label: "متدرب 🌱", color: "bg-green-100 text-green-700" }
      : score < 2000
      ? { label: "محترف ⚡", color: "bg-indigo-100 text-indigo-700" }
      : { label: "خبير 🔥", color: "bg-amber-100 text-amber-700" };

  return (
    <span className={`text-sm font-bold px-4 py-2 rounded-xl ${level.color}`}>
      {level.label}
    </span>
  );
}

// ── InfoItem ──────────────────────────────────────────────────────────────────
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default Profile;