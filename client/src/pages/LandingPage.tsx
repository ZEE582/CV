import Background from '../components/layout/Background'
import Navbar from '../components/layout/Navbar'
import Hero from './devrise-components/Hero'
import StatsBar from './devrise-components/StatsBar'
import Terminal from './devrise-components/Terminal'
import SkillsSection from './devrise-components/SkillsSection'
import Marquee from './devrise-components/Marquee'

export default function LandingPage() {
  return (
<div className="relative min-h-screen bg-white font-grotesk overflow-x-hidden pt-20">
       <Background />
      <Navbar />
      <Hero />
      <StatsBar />
      <Terminal />
      <SkillsSection />
      <Marquee />
    </div>
  )
}
