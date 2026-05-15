import { useEffect, useState } from 'react'

const phrases = [
  'Frontend Developer', 'Backend Engineer', 'Full Stack Dev',
  'DevOps Engineer', 'AI Engineer', 'Mobile Developer',
  'Data Engineer', 'Cloud Architect', 'Blockchain Engineer', 'UI/UX Engineer',
]

const floatingCards = [
  { icon: '⚡', bg: 'bg-indigo-50',  label: 'مسار جديد',   value: 'Full-Stack Dev',      anim: 'animate-float-1', pos: 'left-0 top-5' },
  { icon: '🏆', bg: 'bg-pink-50',    label: 'تم التوظيف',  value: 'Senior Engineer',     anim: 'animate-float-2', pos: 'left-1/4 top-0' },
  { icon: '🚀', bg: 'bg-violet-50',  label: 'مهارة جديدة', value: 'React + TypeScript',  anim: 'animate-float-3', pos: 'right-1/4 top-2' },
  { icon: '💼', bg: 'bg-blue-50',    label: 'عروض عمل',    value: 'من أي مكان',          anim: 'animate-float-4', pos: 'right-10 top-0' },
]

export default function Hero() {
  const [typed, setTyped] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    const current = phrases[phraseIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting) {
      if (charIdx <= current.length) {
        timeout = setTimeout(() => { 
          setTyped(current.substring(0, charIdx))
          setCharIdx(c => c + 1) 
        }, 80)
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 1800)
      }
    } else {
   
      if (charIdx >= 0) {
        timeout = setTimeout(() => { 
          setTyped(current.substring(0, charIdx))
          setCharIdx(c => c - 1) 
        }, 60)
      } else {
        setIsDeleting(false)
        setPhraseIdx(i => (i + 1) % phrases.length)
        timeout = setTimeout(() => {}, 500)
      }
    }

    return () => clearTimeout(timeout)
  }, [charIdx, isDeleting, phraseIdx])

  return (
    <section className="relative z-5 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-4 py-16">

      <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 px-4 py-1.5 rounded-full text-xs tracking-wide mb-8"
        style={{ animation: 'fadeUp 0.8s 0.3s both' }}>
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-dot" /> 
        منصة صُممت لتطوير مهاراتك ووضعك على المسار الصحيح
      </div>

      <h1 className="font-syne font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-tight tracking-tight text-gray-900 mb-6"
        style={{ animation: 'fadeUp 0.8s 0.5s both' }}>
        طوّر مهاراتك
        <span className="block text-gradient">وابنِ مستقبلك</span>
      </h1>

      <p className="text-gray-500 max-w-lg text-base sm:text-lg leading-relaxed mb-10"
        style={{ animation: 'fadeUp 0.8s 0.7s both' }}>
        منصة متكاملة للمبرمجين — تعلّم، تطوّر، وابحث عن وظيفتك المثالية في عالم التقنية
      </p>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-10"
        style={{ animation: 'fadeUp 0.8s 0.9s both' }}>
        <span className="text-indigo-600 font-semibold">مسارك القادم</span>
        <span className="text-pink-500 font-semibold border-r-2 border-pink-400 pr-0.5 animate-blink min-w-[180px] text-left">
          {typed}
        </span>
      </div>


      <div className="flex items-center gap-4 mb-16 flex-wrap justify-center"
        style={{ animation: 'fadeUp 0.8s 1.1s both' }}>
        <button className="flex items-center gap-2 text-sm text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:-translate-y-0.5 transition-all duration-300">
         
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10,8 16,12 10,16" />
          </svg>
          شاهد كيف يعمل
        </button>
      </div>

     
      <div className="relative w-full max-w-3xl h-44" style={{ animation: 'fadeUp 0.8s 1.3s both' }}>
        {floatingCards.map((card) => (
          <div key={card.value}
            className={`absolute ${card.pos} ${card.anim} flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-xs whitespace-nowrap cursor-pointer hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
            
           
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center text-base shrink-0`}>
              {card.icon}
            </div>

      
            <div>
              <span className="text-gray-400 text-[10px] block">{card.label}</span>
              <span className="text-gray-800 font-semibold block">{card.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}