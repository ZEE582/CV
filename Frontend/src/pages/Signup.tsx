import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import AuthLogo from "../components/AuthLogo";
import AuthInput from "../components/AuthInput";
import AuthMessage from "../components/AuthMessage";
import SocialButtons from "../components/SocialButtons";
import Divider from "../components/Divider";
import { validateSignup } from "../validation/signupValidation";
import { signupUser } from "../services/signupService";
function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(true);
  const [loading, setLoading] = useState(false);
  const showMessage = (text: string, error = true) => {
    setMessage(text);
    setIsError(error);
  };
  const handleSignup = async () => {
    setMessage("");
    const validationError = validateSignup(email, password);
    if (validationError) {
      showMessage(validationError);
      return;
    }
    try {setLoading(true);
      const { response, data } = await signupUser(email, password);
      if (!response.ok) {
        showMessage(data.message || "حدث خطأ أثناء إنشاء الحساب");
        return;
      }
      navigate(`/verify-email?email=${encodeURIComponent(email.toLowerCase().trim())}`);
    } catch {
      showMessage("تعذر الاتصال بالسيرفر، تأكد أن الباك إند يعمل");
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthCard>
      <AuthLogo />
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        إنشاء حساب جديد
      </h2>
      <AuthInput label="البريد الإلكتروني"type="email"placeholder="أدخل بريدك الإلكتروني"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <AuthInput label="كلمة المرور" type="password" placeholder="أدخل كلمة المرور"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <AuthMessage message={message} isError={isError} />
      <button onClick={handleSignup}disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
      >{loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
      </button>
      <button onClick={() => navigate("/")}
        className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
      >
        الرجوع إلى تسجيل الدخول
      </button>
      <Divider />
      <SocialButtons />
    </AuthCard>
  );
}

export default Signup;