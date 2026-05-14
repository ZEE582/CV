import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
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

  const handleLogin = async () => {
    setMessage("");

    if (!validateFields()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "فشل تسجيل الدخول");
        return;
      }

      // ✅ بروح على صفحة التحقق بالإيميل
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
          <h1 className="text-5xl font-extrabold text-gray-900 leading-none">
            تتطور
          </h1>
          <p className="text-4xl font-extrabold text-gray-400 tracking-wide">
            ttwar
          </p>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-gray-800 font-medium">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none text-right focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-gray-800 font-medium">
            كلمة المرور
          </label>
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
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
        >
          {loading ? "جاري المعالجة..." : "تسجيل الدخول"}
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="w-full border border-indigo-600 text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-50 transition"
        >
          إنشاء الحساب
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

export default Login;