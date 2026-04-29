import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      setIsError(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "فشل تسجيل الدخول");
        setIsError(true);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("تم تسجيل الدخول بنجاح ✅");
      setIsError(false);

      setTimeout(() => {
        navigate("/student-info");
      }, 800);
    } catch {
      setMessage("تعذر الاتصال بالسيرفر");
      setIsError(true);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10">
          تسجيل الدخول إلى حسابك
        </h1>

        <div className="space-y-6">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="w-full h-14 border border-gray-300 rounded-xl px-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="كلمة المرور"
            className="w-full h-14 border border-gray-300 rounded-xl px-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold text-lg transition transform hover:-translate-y-1 hover:shadow-lg hover:bg-indigo-700"
          >
            تسجيل الدخول
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="w-full h-14 border border-indigo-500 text-indigo-600 rounded-xl font-bold text-lg transition transform hover:-translate-y-1 hover:shadow-lg hover:bg-indigo-50"
          >
            إنشاء حساب
          </button>

          {message && (
            <p
              className={`text-center text-sm font-semibold ${
                isError ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 my-10">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-gray-600">أو</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <div className="grid grid-cols-3 gap-4" dir="ltr">
          <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl h-12 transition transform hover:-translate-y-1 hover:shadow-md hover:bg-gray-50">
            <FcGoogle />
            Google
          </button>

          <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl h-12 transition transform hover:-translate-y-1 hover:shadow-md hover:bg-gray-50">
            <FaGithub />
            GitHub
          </button>

          <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-xl h-12 transition transform hover:-translate-y-1 hover:shadow-md hover:bg-gray-50">
            <FaLinkedin />
            LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;