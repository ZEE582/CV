import Background from './components/Background'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import Terminal from './components/Terminal'
import SkillsSection from './components/SkillsSection'
import Marquee from './components/Marquee'

export default function App() {
  return (
    <div className="relative min-h-screen bg-white font-grotesk overflow-x-hidden">
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
