export interface UserProfile {
  email: string;

  name: string;

  avatar: string;

  provider: string;

  score: number;

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