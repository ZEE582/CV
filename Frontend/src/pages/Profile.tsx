import {useEffect,useState,} from "react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";
import { getProfile } from "../services/profileService";
import ProfileHeader from "../components/profilecompon/ProfileHeader";
import ScoreCard from "../components/profilecompon/ScoreCard";
import ProfileSection from "../components/profilecompon/ProfileSection";
import InfoItem from "../components/profilecompon/InfoItem";
function Profile() {
  const navigate = useNavigate();
  const [user, setUser] =useState<UserProfile | null>( null);
  const [loading, setLoading] =useState(true);
  useEffect(() => {
    const fetchProfile =async () => {
        try {
          const { response, data } =
            await getProfile();
          if (response.ok) {
            setUser(data.user);
          }
        } catch {
          console.error(
            "فشل تحميل البروفايل"
          );
        } finally {
          setLoading(false);
        }
      };
    fetchProfile();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-400">
          جاري التحميل...
        </p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-red-500">
          تعذر تحميل البروفايل
        </p>
      </div>
    );
  }
  const onboarding =
    user.onboardingData;
  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] py-10 px-4" >
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/home") }className="mb-6 text-sm text-indigo-600 hover:underline flex items-center gap-1">
          ← رجوع للرئيسية
        </button>
        <ProfileHeader user={user} />
        <ScoreCard score={user.score ?? 0}/>
        <ProfileSection title="المعلومات الشخصية">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="العمر" value={ onboarding.age ? `${onboarding.age} سنة` : "—"}/>
            <InfoItem label="المدينة" value={onboarding.city || "—" }/>
          </div>
        </ProfileSection>
        <ProfileSection title="المعلومات الأكاديمية">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="الجامعة"value={onboarding.university ||"—" } />
            <InfoItem label="التخصص"value={ onboarding.major ||"—"}/>
          </div>
        </ProfileSection>
        {onboarding.programmingLanguages?.length > 0 && (
          <ProfileSection title="لغات البرمجة">
            <div className="flex flex-wrap gap-2">
              {onboarding.programmingLanguages.map((language) => (
                  <span key={language}className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-lg border border-indigo-200">
                    {language}
                  </span>
                )
              )}
            </div>
          </ProfileSection>
        )}
        <ProfileSection title="المعلومات المهنية">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="الوظيفة"value={onboarding.jobTitle || "—" } />
            <InfoItem label="سنوات الخبرة"value={onboarding.experienceYears || "—"}/>
            <InfoItem label="يبحث عن وظيفة" value={onboarding.lookingForJob? "نعم ✅" : "لا" } />
            <InfoItem label="الاهتمام المهني"value={ onboarding.jobInterest || "—"}/>
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}

export default Profile;