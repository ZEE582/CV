import type { SessionUser } from '../../../shared/AuthContext';
export interface ProfileDetails {
  fullName: string;
  age: number | null;
  city: string;
  university: string;
  major: string;
  programmingLanguages: string[];
  jobTitle: string;
  experienceYears: string;
  lookingForJob: boolean;
  jobInterest: string;
}
export interface UserProfile extends SessionUser {
  avatar: string;
  avatar_url?: string;
  phone: string;
  provider: 'local' | 'google' | 'github' | 'linkedin';
  score: number;
  onboardingData: ProfileDetails;
}
export interface ProfileUpdate {
  name: string;
  avatar: string;
  phone: string;
  onboardingData: ProfileDetails;
}
