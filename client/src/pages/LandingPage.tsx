import Background from '../components/layout/Background'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/LandingPage/Hero_landing'
import StatsBar from '../components/LandingPage/StatsBar'
import Terminal from '../components/LandingPage/Terminal'
import SkillsSection from '../components/LandingPage/SkillsSection'
import Marquee from '../components/LandingPage/Marquee'

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
