import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  email: string;
  name: string;
  avatar: string;
  provider: string;
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
                <span key={lang} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-lg border border-indigo-200">
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default Profile;