import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import AuthLogo from "../components/AuthLogo";
import AuthInput from "../components/AuthInput";
import AuthMessage from "../components/AuthMessage";
import SocialButtons from "../components/SocialButtons";
import Divider from "../components/Divider";
import { validateLogin } from "../validation/authValidation";
import { loginUser } from "../services/loginService";
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const showMessage = (text: string, error = true) => {
    setMessage(text);
    setIsError(error);
  };
  const handleLogin = async () => {
    setMessage("");
    const validationError = validateLogin(email, password);
    if (validationError) {
      showMessage(validationError);
      return;
    }try {
      setLoading(true);
      const { response, data } = await loginUser(email, password);
      if (!response.ok) {
        showMessage(data.message || "فشل تسجيل الدخول");
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
      <AuthInput label="البريد الإلكتروني" type="email" placeholder="أدخل بريدك الإلكتروني"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <AuthInput label="كلمة المرور" type="password" placeholder="أدخل كلمة المرور"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <AuthMessage message={message} isError={isError} />
      <button onClick={handleLogin} disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3 disabled:opacity-60"
      > {loading ? "جاري المعالجة..." : "تسجيل الدخول"}
      </button>
      <button onClick={() => navigate("/signup")}
        className="w-full border border-indigo-600 text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-50 transition"
      >
        إنشاء الحساب
      </button>
      <Divider />
      <SocialButtons />
    </AuthCard>
  );
}

export default Login;