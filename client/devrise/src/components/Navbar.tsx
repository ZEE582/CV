export default function Navbar() {
  return (
    <nav
      className="flex justify-between px-8 sm:px-12 py-5 border-b-2 border-indigo-100">
          <div className="flex gap-5">
    {['login', 'sign up'].map((label) => (
      <button
        key={label}
        className="relative text-sm px-5 py-2 rounded-md border border-indigo-600 text-indigo-600 overflow-hidden
          before:absolute before:inset-0 before:bg-indigo-600 before:-translate-x-full before:transition-transform before:duration-300
          hover:before:translate-x-0 hover:text-white transition-colors duration-300"
      >
        <span className="relative font-[Bitcount Grid Single, system-ui]">{label}</span>
      </button>
    ))}

  </div>
      <div className=" font-[Bitcount Grid Single, system-ui] font-extrabold text-4xl text-gray-900">
        تتطور
        <span className="font-[Bitcount Grid Single, system-ui] text-gray-400 text-4xl pr-6">
          ttwar
        </span>
      </div>
    </nav>
  )
}
