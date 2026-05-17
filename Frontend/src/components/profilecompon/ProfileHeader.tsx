import type { UserProfile } from "../../types/user";
type Props = {user: UserProfile;};
function ProfileHeader({user,}: Props) {
  const onboarding =user.onboardingData;
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-4 flex items-center gap-5">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {user.avatar ? (
          <img src={user.avatar}alt="avatar" className="w-full h-full object-cover"/>
        ) : (<span className="text-3xl font-bold text-indigo-600">
            {(onboarding.fullName ||user.email)
              .charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{onboarding.fullName ||user.name ||"—"}
        </h1>
        <p className="text-sm text-gray-500">{user.email}
        </p>
        {onboarding.city && (
          <p className="text-sm text-gray-400 mt-0.5">
            📍 {onboarding.city}
          </p>
        )}
      </div>
    </div>
  );
}
export default ProfileHeader;