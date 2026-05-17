import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5]">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">تتطور</h1>
          <p className="text-xs text-gray-400">ttwar</p>
        </div>

        <div className="flex items-center gap-3">
          {/* زر تسجيل الخروج */}
          <button
            onClick={handleLogout}
            className="border border-red-400 text-red-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition"
          >
            تسجيل الخروج
          </button>

          {/* دائرة البروفايل */}
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center hover:ring-2 hover:ring-indigo-400 transition overflow-hidden"
            title="البروفايل"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-indigo-600 font-bold text-base">
                {(user.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <div className="text-center">
          <p className="text-gray-400">الصفحة الرئيسية</p>
        </div>
      </div>
    </div>
  );
}

export default Home;