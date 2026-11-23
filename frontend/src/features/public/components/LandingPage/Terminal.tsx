export default function Terminal() {
  return (
    <div className="relative z-10 max-w-xl mx-auto my-12 px-6">
      <div className="bg-gray-900 border border-gray-200 rounded-xl overflow-hidden font-[Bitcount Grid Single, system-ui] shadow-lg">
        <div className="flex items-center gap-1.5 bg-gray-800 px-4 py-2.5 border-b border-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
          <span className="mx-auto text-gray-400 text-xs font-[Bitcount Grid Single, system-ui]">devrise — bash</span>
        </div>
        <div className="p-5 text-xs leading-relaxed space-y-1">
            <div className="text-indigo-400">$<span className="text-gray-200">devrise scan --skills</span> </div>
            <div className="text-gray-500"># تحليل مهاراتك الحالية...</div>
            <div className="text-pink-400">✦ JavaScript: Advanced</div>
            <div className="text-pink-400">✦ React: Intermediate → <span className="text-indigo-400">مسار ترقية متاح</span></div>
            <div className="text-pink-400">✦ System Design: Beginner → <span className="text-indigo-400">مسار ترقية متاح</span></div>
            <div className="text-indigo-400">→ فرص عمل مطابقة لملفك الشخصي ✓</div>
        </div>
      </div>
    </div>
  )
}
