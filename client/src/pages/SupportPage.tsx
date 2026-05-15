import Navbar from '../components/layout/Navbar'
import tiersData from '../data/tiers'
import Background from '../components/layout/Background'
import Hero_support from '../components/supportPage/Hero_support'
import PricingCards from '../components/supportPage/cards_support'
import Footer from '../components/supportPage/Footer'

const tiers = tiersData;

export default function SupportPage() {
  return (
    <div className="relative isolate bg-white px-6 pt-20 sm:pt-24 lg:px-8">
      <Navbar />
      <Background />
      <Hero_support />    
      <PricingCards tiers={tiers} />
      <Footer />
    </div>
  )
}