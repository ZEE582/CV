const items = ['FULL STACK', 'BACKEND', 'FRONTEND', 'DEVOPS', 'AI / ML', 'MOBILE', 'SYSTEM DESIGN', 'CLOUD', 'OPEN SOURCE']

export default function Marquee() {
  const doubled = [...items, ...items]
  return (
    <div className="border-gray-100 py-4 mt-8">
      <div className="flex gap-12 w-max animate-marquee text-sm text-gray-300">
        {doubled.map((item, i) => (
          <span key={i} className="whitespace-nowrap">
            {item} <span className="text-indigo-400 mx-2">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
