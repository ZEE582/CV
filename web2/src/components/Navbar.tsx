export default function Navbar() {
  return (
    <div className="flex justify-between items-center px-8 py-4 bg-[#1e1b4b] text-white">

      {/* Logo */}
      <h1 className="text-xl font-bold">
        <span className="text-indigo-400">ttwar</span> تتطور
      </h1>

      {/* Title */}
      <span className="text-gray-300">لوحة التحكم</span>

    </div>
  );
}