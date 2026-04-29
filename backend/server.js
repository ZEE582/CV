const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./config/db");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// إنشاء حساب جديد
app.post("/signup", async (req, res) => {
  try {
    const { email, password, birthDate, city, method } = req.body;

    if (!email || !password || !birthDate || !city) {
      return res.status(400).json({
        message: "الرجاء تعبئة جميع الحقول",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "كلمة المرور يجب أن تكون 8 أحرف أو أرقام على الأقل",
      });
    }

    const [existingUser] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "هذا البريد الإلكتروني مستخدم مسبقًا",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (email, password, method, birth_date, city) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, method || "email", birthDate, city]
    );

    res.status(201).json({
      message: "تم إنشاء الحساب بنجاح",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
});

// تسجيل دخول حقيقي
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "الرجاء إدخال البريد الإلكتروني وكلمة المرور",
      });
    }

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "البريد الإلكتروني غير موجود",
      });
    }

    const user = users[0];

    if (!user.password) {
      return res.status(400).json({
        message: "هذا الحساب مسجل بطريقة خارجية",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "كلمة المرور غير صحيحة",
      });
    }

    res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: user.id,
        email: user.email,
        birthDate: user.birth_date,
        city: user.city,
        method: user.method,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});