import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Questions from "./pages/Questions";
import Home from "./pages/Home";
import VerifyEmail from "./services/Verifyemail";
import Profile from "./pages/Profile";

function TokenHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate(window.location.pathname, { replace: true });
    }
  }, []);

  return null;
}

function SmartRedirect() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (!user.hasCompletedQuestions) return <Navigate to="/questions" replace />;
  return <Navigate to="/home" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <TokenHandler />
      <Routes>
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;