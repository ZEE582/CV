import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FcGoogle } from "react-icons/fc";

import {
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage(
        "الرجاء إدخال البريد الإلكتروني وكلمة المرور"
      );

      setIsError(true);

      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5001/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data.message ||
            "فشل تسجيل الدخول"
        );

        setIsError(true);

        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setMessage(
        "تم تسجيل الدخول بنجاح ✅"
      );

      setIsError(false);

      setTimeout(() => {
        if (
          data.user.role === "admin"
        ) {
          navigate("/dashboard");
        } else if (
          data.user.role ===
          "company"
        ) {
          navigate(
            "/company-dashboard"
          );
        } else {
          navigate("/dashboard");
        }
      }, 800);
    } catch {
      setMessage(
        "تعذر الاتصال بالسيرفر"
      );

      setIsError(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",

        backgroundColor: "#141b2d",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "20px",
      }}
      dir="rtl"
    >
      <div
        style={{
          width: "100%",

          maxWidth: "420px",

          backgroundColor:
            "#1F2A40",

          padding: "35px",

          borderRadius: "18px",

          color: "white",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",

            marginBottom: "30px",
          }}
        >
          تسجيل الدخول
        </h1>

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          style={{
            width: "100%",

            height: "50px",

            marginBottom: "15px",

            borderRadius: "10px",

            border:
              "1px solid #4b5563",

            padding: "0 15px",

            backgroundColor:
              "#111827",

            color: "white",
          }}
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",

            height: "50px",

            marginBottom: "15px",

            borderRadius: "10px",

            border:
              "1px solid #4b5563",

            padding: "0 15px",

            backgroundColor:
              "#111827",

            color: "white",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",

            height: "50px",

            border: "none",

            borderRadius: "10px",

            backgroundColor:
              "#4cceac",

            color: "#111827",

            fontWeight: "bold",

            cursor: "pointer",
          }}
        >
          تسجيل الدخول
        </button>

        {message && (
          <p
            style={{
              marginTop: "15px",

              textAlign: "center",

              color: isError
                ? "#ef4444"
                : "#22c55e",

              fontWeight: "bold",
            }}
          >
            {message}
          </p>
        )}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "10px",

            margin: "25px 0",
          }}
        >
          <div
            style={{
              height: "1px",

              backgroundColor:
                "#4b5563",

              flex: 1,
            }}
          />

          <span>أو</span>

          <div
            style={{
              height: "1px",

              backgroundColor:
                "#4b5563",

              flex: 1,
            }}
          />
        </div>

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1fr 1fr 1fr",

            gap: "10px",
          }}
        >
          <button
            style={{
              height: "42px",

              borderRadius: "8px",

              border: "none",
            }}
          >
            <FcGoogle /> Google
          </button>

          <button
            style={{
              height: "42px",

              borderRadius: "8px",

              border: "none",
            }}
          >
            <FaGithub /> GitHub
          </button>

          <button
            style={{
              height: "42px",

              borderRadius: "8px",

              border: "none",
            }}
          >
            <FaLinkedin /> LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;