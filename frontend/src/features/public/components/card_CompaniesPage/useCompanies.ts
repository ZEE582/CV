import { useState, useEffect } from 'react';
import { apiRequest } from '../../../../shared/api';
interface CompanyRecord { _id: string; name_ar: string; name_en?: string; location?: string; logo_url?: string; website?: string; stacks?: Record<string, unknown>; }
export default function useCompanies() {
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    apiRequest<{ companies: CompanyRecord[] }>('/companies').then(data => {
      if (!cancelled) setCompanies(data.companies.map(company => ({ ...company, id: company._id, company_name: company.name_ar || company.name_en, city: company.location || '', company_logo: company.logo_url || '', website: company.website || '', tech_stack: company.stacks || {} })));
    }).catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { selectedCity, setSelectedCity, searchQuery, setSearchQuery, companies, loading, error };
}
