// ─── Domain Types ────────────────────────────────────────────
export type JobRegion = 'ضفة' | 'قدس' | 'غزة' | '48' | 'remote';
export type JobType   = 'دوام كامل' | 'دوام جزئي' | 'عقد مؤقت' | 'عمل عن بُعد' | 'فريلانس' | 'تدريب مدفوع';
export type ExpLevel  = 'حديث التخرج' | '1-3 سنوات' | '3-5 سنوات' | '+5 سنوات' | 'قيادي';
export type Currency  = '₪' | '$' | '€' | 'JD';

export interface Job {
  _id:                string;
  id:                 string;
  company_id:         string;
  title:              string;
  description:        string;
  requirements:       string[];
  benefits:           string[];
  location:           string | null;
  region:             JobRegion | null;
  field:              string | null;
  job_type:           JobType | null;
  experience_level:   ExpLevel | null;
  salary_min:         number | null;
  salary_max:         number | null;
  salary_currency:    Currency;
  salary_visible:     boolean;
  deadline:           string | null;
  is_featured:        boolean;
  is_active:          boolean;
  views_count:        number;
  applications_count: number;
  createdAt:          string;
  updatedAt:          string;
  // company fields (populated)
  company_name?:     string;
  company_name_en?:  string;
  color?:            string;
  company_verified?: boolean;
  logo_url?:         string | null;
}

export interface Company {
  _id:          string;
  id:           string;
  user_id:      string | null;
  name_ar:      string;
  name_en:      string | null;
  logo_url:     string | null;
  sector:       string | null;
  size:         string | null;
  founded_year: number | null;
  location:     string | null;
  region:       JobRegion | null;
  website:      string | null;
  email:        string | null;
  about_ar:     string;
  color:        string;
  is_verified:  boolean;
  is_active:    boolean;
  views_count:  number;
  jobs_count?:  number;
  createdAt:    string;
}

export interface JobFilters { q: string; type: string; exp: string; reg: string; }
export interface Toast      { id: string; message: string; type: 'ok' | 'err'; }

export interface JobsResponse      { success: boolean; total: number; jobs: Job[]; }
export interface CompaniesResponse { success: boolean; companies: Company[]; }
export interface CompanyResponse   { success: boolean; company: Company; jobs: Job[]; }
