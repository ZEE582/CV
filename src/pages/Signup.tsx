import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(true);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:3000/api/auth";

  const showMessage = (text: string, error = true) => {
    setMessage(text);
    setIsError(error);
  };

  const validateFields = () => {
    if (!email.trim()) {
      showMessage("يرجى إدخال البريد الإلكتروني");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("صيغة البريد الإلكتروني غير صحيحة");
      return false;
    }
    if (!password.trim()) {
      showMessage("يرجى إدخال كلمة المرور");
      return false;
    }
    if (password.length < 8) {
      showMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    setMessage("");
    if (!validateFields()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "student" }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "حدث خطأ أثناء إنشاء الحساب");
        return;
      }

      // بعد إنشاء الحساب بروح على صفحة التحقق
      navigate(`/verify-email?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    } catch {
      showMessage("تعذر الاتصال بالسيرفر، تأكد أن الباك إند يعمل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-3xl bg-white shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-none">تتطور</h1>
          <p className="text-4xl font-extrabold text-gray-400 tracking-wide">ttwar</p>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">إنشاء حساب جديد</h2>

        <div className="mb-4">
          <label className="block mb-2 text-gray-800 font-medium">البريد الإلكتروني</label>
          <input
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-right focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-gray-800 font-medium">كلمة المرور</label>
          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-right focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {message && (
          <p className={`text-center mb-4 text-sm font-medium ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
        >
          {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
        >
          الرجوع إلى تسجيل الدخول
        </button>
         <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-500 text-sm">أو</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
        
                <div className="grid grid-cols-3 gap-3" dir="ltr">
                  {/* ✅ Google */}
                  <button
                    onClick={() => { window.location.href = "http://localhost:3000/api/auth/google"; }}
                    className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
                  >
                    <FcGoogle size={20} />
                    <span className="text-sm font-medium text-gray-700">Google</span>
                  </button>
        
                  <button
                    onClick={() => { window.location.href = "http://localhost:3000/api/auth/github"; }}
                    className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
                  >
                    <FaGithub size={20} />
                    <span className="text-sm font-medium text-gray-700">GitHub</span>
                  </button>
        
        <button
          onClick={() => {
            window.location.href = "http://localhost:3000/api/auth/linkedin";
          }}
          className="border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition"
        >
          <FaLinkedin size={20} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">LinkedIn</span>
        </button>
                </div>
              </div>
      </div>
  );
}

export default Signup;