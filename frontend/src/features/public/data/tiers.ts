export interface Tier {
  name: string
  id: string
  href: string
  priceMonthly: string
  description: string
  features: string[]
  featured: boolean
  badge?: string
  isEnterprise?: boolean
}
const tiers: Tier[] = [
  {
    name: 'One-time',
    id: 'tier-onetime',
    href: '#',
    priceMonthly: '$10',
    description: 'Make a one-time donation to support the project.',
    features: [
      'Help cover hosting costs',
      'Keep the project alive',
      'Our gratitude',
    ],
    featured: false,
  },

  {
    name: 'Monthly',
    id: 'tier-monthly',
    href: '#',
    priceMonthly: '$5',
    description: 'Support the project with a small monthly donation.',
    features: [
      'Help cover hosting costs',
      'Keep the project alive',
      'Get supporter badge',
      'Priority support',
    ],
    featured: false,
  },

  {
    name: 'Sponsor',
    id: 'tier-sponsor',
    href: '#',
    priceMonthly: '$25',
    description: 'Become a sponsor and help us grow.',
    features: [
      'All supporter benefits',
      'Name in sponsors list',
      'Early access to new features',
      'Direct access to developers',
      'Custom feature requests',
      'Logo on our website',
    ],
    featured: true,
    badge: 'Most Popular',
  },

  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: '$100',
    description: 'A complete solution for companies — showcase your brand, hire top talent, and manage your team.',
    features: [
      'Dedicated company dashboard',
      'Public company profile with tech stack showcase',
      'Post & manage job listings on the platform',
      'Employee training & onboarding programs',
      'Employee skill assessments & testing tools',
      'Analytics & performance reports',
      'Featured company placement on homepage',
      'Priority support & dedicated account manager',
    ],
    featured: true,
    isEnterprise: true,
    badge: 'For Companies',
  },
]

export default tiers