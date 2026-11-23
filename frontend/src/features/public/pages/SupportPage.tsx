
import Background from '../components/layout/Background'
import Hero_support from '../components/supportPage/Hero_support'
import PricingCards from '../components/supportPage/cards_support'
import Footer from '../components/supportPage/Footer'



export default function SupportPage() {
  return (
    <div className="relative isolate bg-white px-6 pt-8 sm:pt-12 lg:px-8">
      <Background />
      <Hero_support />
      <PricingCards />
      <Footer />
    </div>
  )
}
