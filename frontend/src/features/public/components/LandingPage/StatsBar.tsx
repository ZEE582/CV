const stats = [
  { id: 1, num: '400 B+', desc: 'قيمة سوق التعليم الإلكتروني' },
  { id: 2, num: '1.2 B+', desc: 'طلاب يستخدمون منصات التعليم' },
  { id: 3, num: '83%',  desc: 'شركات تعتمد التعلم الإلكتروني' },
  { id: 4, num: '70%',  desc: 'تعلّم عبر الهواتف المحمولة' },
]

export default function StatsBar() {
  return (
    <div className="relative flex justify-center ">
      {stats.map((stat, i) => (
        <div key={stat.id}
          className={`flex-1 max-w-[200px] py-8 px-6 text-center hover:bg-indigo-50/55 ${i !== stats.length - 1 ? 'border-r border-gray-100' : ''}`}>
          <span className="font-[Bitcount Grid Single, system-ui] font-extrabold text-3xl text-indigo-600 block mb-1">{stat.num}</span>
          <p className="text-gray-500 text-sm">{stat.desc}</p>
        </div>
      ))}
    </div>
  )
}
