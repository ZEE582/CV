import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // ✅ الطريقة الصحيحة لتعريف ref لمصفوفة inputs
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const API_URL = "http://localhost:3000/api/auth";

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const showMessage = (text: string, error = true) => {
    setMessage(text);
    setIsError(error);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (pasted.length === 5) {
      setDigits(pasted.split(""));
      inputsRef.current[4]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 5) {
      showMessage("يرجى إدخال الكود كاملاً");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "كود غير صحيح");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("تم التحقق بنجاح!", false);

      setTimeout(() => {
        if (data.user.hasCompletedQuestions) {
          navigate("/home");
        } else {
          navigate("/questions");
        }
      }, 800);
    } catch {
      showMessage("تعذر الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "حدث خطأ");
        return;
      }

      showMessage("تم إعادة إرسال الكود", false);
      setCountdown(60);
      setDigits(["", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch {
      showMessage("تعذر الاتصال بالسيرفر");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-3xl bg-white shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-none">تتطور</h1>
          <p className="text-4xl font-extrabold text-gray-400 tracking-wide">ttwar</p>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">تحقق من بريدك</h2>
          <p className="text-sm text-gray-500">أرسلنا كود مكون من 5 أرقام إلى</p>
          <p className="text-sm font-medium text-indigo-600 mt-1" dir="ltr">{email}</p>
        </div>

        {/* خانات الكود */}
        <div className="flex justify-center gap-3 mb-6" dir="ltr">
          {digits.map((digit, index) => (
            <input
              key={index}
              // ✅ الإصلاح هون — بدل arrow function بنستخدم هيك
              ref={(el) => { if (el) inputsRef.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition
                ${digit ? "border-indigo-500 bg-indigo-50" : "border-gray-300"}
                focus:border-indigo-500`}
            />
          ))}
        </div>

        {message && (
          <p className={`text-center mb-4 text-sm font-medium ${isError ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || digits.join("").length < 5}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
        >
          {loading ? "جاري التحقق..." : "تأكيد الكود"}
        </button>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-400">
              إعادة الإرسال بعد{" "}
              <span className="font-medium text-indigo-600">{countdown}</span> ثانية
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-60"
            >
              {resendLoading ? "جاري الإرسال..." : "أعد إرسال الكود"}
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition text-center"
        >
          ← رجوع لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;