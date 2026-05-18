// ─── CV Types & Constants ─────────────────────────────────────────────────────

export interface CVData {
  fullName: string; jobTitle: string; email: string; phone: string;
  location: string; linkedin: string; github: string; portfolio: string;
  summary: string; skills: string[];
  languages: { lang: string; level: string }[];
  experience: {
    id: string; company: string; role: string; startDate: string;
    endDate: string; current: boolean; description: string; tech: string[];
  }[];
  education: {
    id: string; school: string; degree: string; field: string;
    startDate: string; endDate: string; gpa: string;
  }[];
  projects: {
    id: string; name: string; description: string; tech: string[];
    url: string; github: string;
  }[];
  certifications: {
    id: string; name: string; issuer: string; date: string; url: string;
  }[];
  templateId: number; accentColor: string;
}

export type Step = 'intro' | 'personal' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'preview';

export const STEPS: { id: Step; labelAr: string; labelEn: string; icon: string }[] = [
  { id: 'personal',       labelAr: 'المعلومات الشخصية',  labelEn: 'Personal Info',    icon: '👤' },
  { id: 'skills',         labelAr: 'المهارات والتقنيات', labelEn: 'Skills & Tech',    icon: '⚡' },
  { id: 'experience',     labelAr: 'الخبرة العملية',     labelEn: 'Work Experience',  icon: '💼' },
  { id: 'education',      labelAr: 'التعليم',            labelEn: 'Education',        icon: '🎓' },
  { id: 'projects',       labelAr: 'المشاريع',           labelEn: 'Projects',         icon: '🚀' },
  { id: 'certifications', labelAr: 'الشهادات',           labelEn: 'Certifications',   icon: '📜' },
  { id: 'preview',        labelAr: 'المعاينة والتحميل',  labelEn: 'Preview & Export', icon: '✨' },
];

export const AC   = '#6B5FE6';
export const ACL  = 'rgba(107,95,230,0.09)';
export const ACB  = 'rgba(107,95,230,0.20)';

export const SKILL_TAGS = [
  'JavaScript','TypeScript','React','Vue.js','Angular','Next.js','Node.js','Express.js',
  'Python','Django','FastAPI','Java','Spring Boot','C#','.NET','PHP','Laravel',
  'MySQL','PostgreSQL','MongoDB','Redis','GraphQL','REST API','Docker','Kubernetes',
  'AWS','Azure','GCP','Git','CI/CD','Linux','Agile/Scrum','HTML','CSS','Tailwind CSS',
  'Flutter','React Native','Figma',
];

export const TEMPLATE_NAMES  = [
  'Modern Tech','Clean Minimal','Bold Executive','Creative Side',
  'Dark Professional','Elegant Classic','Compact Grid','Gradient Pro',
  'Two-Column Edge','Blueprint Code',
];

export const TEMPLATE_COLORS = [
  '#6B5FE6','#0ea5e9','#1e293b','#059669',
  '#0f172a','#9333ea','#dc2626','#d97706',
  '#0891b2','#16a34a',
];

export const LANG_LEVELS = ['Native','Fluent','Professional','Conversational','Basic'];

export const uid = () => Math.random().toString(36).slice(2, 9);

export const defaultCV = (): CVData => ({
  fullName:'', jobTitle:'', email:'', phone:'', location:'',
  linkedin:'', github:'', portfolio:'', summary:'',
  skills:[], languages:[{ lang:'Arabic', level:'Native' },{ lang:'English', level:'Professional' }],
  experience:[], education:[], projects:[], certifications:[],
  templateId:1, accentColor:'#6B5FE6',
});
