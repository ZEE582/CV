import { useState } from 'react'
import companiesData from '../data/company-data.json'
import Navbar from '../components/layout/Navbar'

function CompanyCard({ company }: { company: any }) {

  const stackCategories = company.tech_stack?.tech_stack || []

  const getCompanyLogo = (company: any) => {
    if (company.company_logo) return company.company_logo

    if (!company.website) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name)}&background=EEF2FF&color=4F46E5&bold=true`
    }

    const domain = company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }

  const hasTechData =
    company.tech_stack &&
    Object.values(company.tech_stack).some((arr: any) => Array.isArray(arr) && arr.length > 0)

  return (
    
    <div className="flex flex-col bg-white/70 backdrop-blur-md rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 p-6 ring-1 ring-gray-200 hover:ring-indigo-300">

      {/* Header */}
      
      <div className="flex items-start gap-4 mb-6">

        <div className="h-16 w-16 shrink-0">
          <img
            src={getCompanyLogo(company)}
            alt={company.company_name}
            className="h-full w-full object-contain rounded-2xl bg-white p-1 shadow-sm border border-gray-100"
          />
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="text-xl font-bold text-gray-900">
            {company.company_name}
          </h3>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-500 hover:underline block"
            >
              {company.website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}

          {company.city && (
            <span className="text-xs text-gray-500">
              {company.city}
            </span>
          )}

        </div>

      </div>

      {/* Tech Stack */}
      <div className="flex-1 space-y-4">

        {hasTechData ? (
          stackCategories.map((category: string) => {

            const techs = company.tech_stack?.[category] || []

            if (techs.length === 0) return null

            return (
              <div key={category}>

                <div className="mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {category}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">

                  {techs.map((tech: any) => (
                    <div
                      key={tech.name}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5"
                    >
                      {tech.icon && (
                        <img
                          src={tech.icon}
                          alt={tech.name}
                          className="w-3.5 h-3.5"
                        />
                      )}

                      {tech.name}
                    </div>
                  ))}

                </div>

              </div>
            )
          })
        ) : (
          <p className="text-sm text-gray-400 italic">
            No tech stack data available
          </p>
        )}

      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 text-right text-[10px] text-gray-400 uppercase tracking-widest font-bold">
        Tech Company
      </div>

    </div>
  )
}

export default function CompaniesPage() {
  const [selectedCity, setSelectedCity] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const cities = ['All', ...new Set(companiesData.companies.map((c: any) => c.city).filter(Boolean))]

  const filteredCompanies = companiesData.companies.filter((company: any) => {

    const matchesCity = selectedCity === 'All' || company.city === selectedCity

    const safeName = company.company_name || ''
    const safeCity = company.city || ''

    const searchInStacks = () => {
      const categories = company.tech_stack?.tech_stack || []

      return categories.some((category: string) => {
        const techs = company.tech_stack?.[category] || []

        return techs.some((tech: any) =>
          tech?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    const matchesSearch =
      searchQuery === '' ||
      safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchInStacks()

    return matchesCity && matchesSearch
  })

  return (
    <div className="relative isolate bg-white px-6 pt-20 sm:pt-24 lg:px-8 min-h-screen">

      {/* Background */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%,100% 61.6%,97.5% 26.9%,85.5% 0.1%,80.7% 2%,72.5% 32.5%,60.2% 62.4%,52.4% 68.1%,47.5% 58.3%,45.2% 34.5%,27.5% 76.7%,0.1% 64.9%,17.9% 100%,27.6% 76.8%,76.1% 97.7%,74.1% 44.1%)'
          }}
          className="mx-auto aspect-[1155/678] w-6xl bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
        />
      </div>

      <Navbar />

      <div className="mx-auto max-w-4xl text-center mb-12">
        <h2 className="text-base font-semibold text-indigo-600">Palestine Tech</h2>
        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Palestinian Tech Companies
        </p>
        <p className="mt-6 text-lg text-gray-600">
          Explore tech stacks used by {companiesData.companies.length} companies in Palestine
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

          {cities.map((city: any) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border
              ${selectedCity === city
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {filteredCompanies.map((company: any) => (
            <CompanyCard key={company.company_name} company={company} />
          ))}

        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-gray-100 text-center">
        <p className="text-gray-500">
          {searchQuery
            ? `Found ${filteredCompanies.length} companies`
            : `Showing ${filteredCompanies.length} companies in ${selectedCity}`}
        </p>
      </footer>

    </div>
  )
}
