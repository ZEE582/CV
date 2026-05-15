export default function CompanyCard({ company }: { company: any }) {

  const stackCategories = Object.keys(company.tech_stack || {})

  const getCompanyLogo = (company: any) => {
    if (company.company_logo) return company.company_logo
  
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