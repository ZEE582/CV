import { useState, useEffect } from 'react'
import axios from 'axios'

export default function useCompanies() {
  const [selectedCity, setSelectedCity] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    axios.get(`http://localhost:3000/api/company`)
      .then(res => res.data)
      .then(data => {
        setCompanies(data.companies || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching companies:', err)
        setLoading(false)
      })
  }, [])
  
  return { selectedCity, setSelectedCity, searchQuery, setSearchQuery, companies, loading }
}