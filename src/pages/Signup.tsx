import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !birthDate || !city) {
      setMessage("الرجاء تعبئة جميع الحقول");
      setIsError(true);
      return;
    }

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 أحرف أو أرقام على الأقل");
      setIsError(true);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          birthDate,
          city,
          method: "email",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "حدث خطأ أثناء إنشاء الحساب");
        setIsError(true);
        return;
      }

      setMessage("تم إنشاء الحساب بنجاح ✅");
      setIsError(false);

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
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
          إنشاء حساب جديد
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

          <input
            type="date"
            className="w-full h-14 border border-gray-300 rounded-xl px-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />

          <input
            type="text"
            placeholder="المدينة"
            className="w-full h-14 border border-gray-300 rounded-xl px-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <button
            onClick={handleSignup}
            className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold text-lg transition transform hover:-translate-y-1 hover:shadow-lg hover:bg-indigo-700"
          >
            إنشاء الحساب
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full h-14 border border-indigo-500 text-indigo-600 rounded-xl font-bold text-lg transition transform hover:-translate-y-1 hover:shadow-lg hover:bg-indigo-50"
          >
            الرجوع لتسجيل الدخول
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
      </div>
    </div>
  );
}

export default Signup;