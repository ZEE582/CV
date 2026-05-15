import useFilter from './Filter'
import useCompanies from './useCompanies'
import CompanyCard from './CompanyCard'
import Background from '../layout/Background'

export default function Search() {
  const {
    companies = [],
    selectedCity,
    setSelectedCity,
    searchQuery,
    setSearchQuery,
    loading
  } = useCompanies()

  const { cities = [], filteredCompanies = [] } = useFilter(
    companies,
    selectedCity,
    searchQuery
  )

  return (
    <div className="relative isolate bg-white px-6 pt-20 sm:pt-24 lg:px-8 min-h-screen">
      <Background />

      <div className="mx-auto max-w-4xl text-center mb-12">
        <h2 className="text-base font-semibold text-indigo-600">
          Palestine Tech
        </h2>

        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Palestinian Tech Companies
        </p>

        <p className="mt-6 text-lg text-gray-600">
          Explore tech stacks used by {companies?.length || 0} companies in Palestine
        </p>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search company, city, or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* City Filter */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {cities?.map((city: any) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border
              ${
                selectedCity === city
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                  : 'bg-white/60 text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Loading companies...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanies?.map((company: any, index: number) => (
              <CompanyCard
                key={company._id || company.id || company.company_name || index}
                company={company}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-gray-100 text-center">
        <p className="text-gray-500">
          {searchQuery
            ? `Found ${filteredCompanies?.length || 0} companies`
            : `Showing ${filteredCompanies?.length || 0} companies in ${selectedCity}`}
        </p>
      </footer>
    </div>
  )
}