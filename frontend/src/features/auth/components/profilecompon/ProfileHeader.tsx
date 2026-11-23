import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { UserProfile } from '../../types/user';
export default function ProfileHeader({ user }: { user: UserProfile }) {
  const [failed, setFailed] = useState(false);
  const name = user.name || user.onboardingData?.fullName || user.email; const avatar = user.avatar || user.avatar_url || '';
  return <div className="profile-identity"><div className="profile-avatar">
    {/^https?:\/\//i.test(avatar) && !failed ? <img src={avatar} alt={`صورة ${name}`} referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
  </div><div className="profile-identity-text"><h2>{name}</h2><p dir="ltr">{user.email}</p>{user.onboardingData?.city && <p className="profile-location"><MapPinIcon aria-hidden="true" />{user.onboardingData.city}</p>}</div></div>;
}
