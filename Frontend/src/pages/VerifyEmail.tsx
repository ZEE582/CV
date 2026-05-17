import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import AuthLogo from "../components/AuthLogo";
import AuthMessage from "../components/AuthMessage";
import CodeInputs from "../components/verifyemailcompo/CodeInputs";
import VerifyHeader from "../components/verifyemailcompo/VerifyHeader";
import { verifyCode } from "../services/verifyService";
import { resendCode } from "../services/resendCodeService";
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
  const inputsRef = useRef<HTMLInputElement[]>([]);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => { setCountdown((current) => current - 1);}, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  const showMessage = (text: string, error = true) => {
    setMessage(text);
    setIsError(error);
  };
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updatedDigits = [...digits];
    updatedDigits[index] = value.slice(-1);
    setDigits(updatedDigits);
    if (value && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 5);
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
    }try {
      setLoading(true);
      setMessage("");
      const { response, data } = await verifyCode(email, code);
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
    try {
      setResendLoading(true);
      setMessage("");
      const { response, data } = await resendCode(email);
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
    <AuthCard>
      <AuthLogo />
      <VerifyHeader email={email} />
      <CodeInputs digits={digits}inputsRef={inputsRef} onChange={handleChange}onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <AuthMessage message={message} isError={isError} />
      <button onClick={handleVerify} disabled={loading || digits.join("").length < 5}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
      >
        {loading ? "جاري التحقق..." : "تأكيد الكود"}
      </button>
        <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-400">
            إعادة الإرسال بعد{" "}
            <span className="font-medium text-indigo-600">{countdown}</span>{" "}
            ثانية
          </p>
        ) : (
          <button onClick={handleResend}   disabled={resendLoading}
            className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-60"
          > {resendLoading ? "جاري الإرسال..." : "أعد إرسال الكود"}
          </button>
        )}
      </div>
      <button  onClick={() => navigate("/")}
        className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition text-center"
      > ← رجوع لتسجيل الدخول
      </button>
    </AuthCard>
  );
}

export default VerifyEmail;