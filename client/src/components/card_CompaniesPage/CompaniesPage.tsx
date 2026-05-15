import useCompanies from './useCompanies'
import Background from '../layout/Background'

export default function CompaniesPage() {
  const { companies, searchQuery, setSearchQuery } = useCompanies()

  return (
    // تغليف الكود بـ main أو div رئيسي
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Background />
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-base font-semibold text-indigo-600 uppercase tracking-wide">
          Palestine Tech
        </h2>
        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Palestinian Tech Companies
        </p>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Explore tech stacks used by <span className="font-bold text-indigo-600">{companies.length}</span> companies in Palestine
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {/* أيقونة بحث بسيطة لتعزيز تجربة المستخدم */}
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search company, city, or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all outline-none"
          />
        </div>
      </div>
    </main>
  )
}