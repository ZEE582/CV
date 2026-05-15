import { useMemo } from 'react'

export default function useFilter(
  companies: any[],
  selectedCity: string,
  searchQuery: string
) {
  const normalizedQuery =
    searchQuery.toLowerCase().trim()

  const cities = useMemo(
    () => [
      'All',
      ...new Set(
        companies
          .map((c: any) => c.city)
          .filter(Boolean)
      )
    ],
    [companies]
  )

  const filteredCompanies = companies.filter(
    (company: any) => {
      const matchesCity =
        selectedCity === 'All' ||
        company.city === selectedCity

      const safeName =
        company.company_name || ''

      const searchInStacks = () => {
        const categories = Object.keys(
          company.tech_stack || {}
        )

        return categories.some(
          (category: string) => {
            const techs =
              company.tech_stack?.[category] || []

            return techs.some((tech: any) => {
              // String array
              if (typeof tech === 'string') {
                return tech
                  .toLowerCase()
                  .includes(normalizedQuery)
              }

              // Object array
              return tech?.name
                ?.toLowerCase()
                .includes(normalizedQuery)
            })
          }
        )
      }

      const matchesSearch =
        normalizedQuery === '' ||
        safeName
          .toLowerCase()
          .includes(normalizedQuery) ||
        searchInStacks()

      return matchesCity && matchesSearch
    }
  )


  return {
    cities,
    filteredCompanies
  }
}