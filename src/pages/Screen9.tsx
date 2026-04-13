import { useState } from "react";
import "./screen9.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Screen9() {
  const [users, setUsers] = useState(["أحمد", "سارة"]);
  const [companies, setCompanies] = useState(["Google", "Amazon"]);
  const [jobs, setJobs] = useState(["مبرمج", "مصمم"]);

  const [input, setInput] = useState("");

  // بيانات الرسم
  const data = [
    { name: "يناير", value: 20 },
    { name: "فبراير", value: 40 },
    { name: "مارس", value: 35 },
    { name: "أبريل", value: 60 }
  ];

  return (
    <div className="container">

      {/* Navbar */}
      <div className="navbar">
        <h2>لوحة التحكم</h2>
        <div>🔔 ⚙️ 👤</div>
      </div>

      {/* Cards */}
      <div className="cards">
        <div className="card">👤 المستخدمين: {users.length}</div>
        <div className="card">🏢 الشركات: {companies.length}</div>
        <div className="card">💼 الوظائف: {jobs.length}</div>
      </div>

      {/* Chart */}
      <div className="chartBox">
        <h3>الإحصائيات</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sections */}
      <Section title="المستخدمين" data={users} setData={setUsers} input={input} setInput={setInput} />
      <Section title="الشركات" data={companies} setData={setCompanies} input={input} setInput={setInput} />
      <Section title="الوظائف" data={jobs} setData={setJobs} input={input} setInput={setInput} />
    </div>
  );
}

// 🔁 Component
function Section({ title, data, setData, input, setInput }: any) {
  return (
    <div className="box">
      <h3>{title}</h3>

      <div className="inputRow">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="أدخل قيمة"
        />

        <button
          onClick={() => {
            if (input.trim() !== "") {
              setData([...data, input]);
              setInput("");
            }
          }}
        >
          إضافة
        </button>
      </div>

      {data.map((item: string, index: number) => (
        <div key={index} className="item">
          <span>{item}</span>

          <div>
            <button
              onClick={() => {
                const newValue = prompt("تعديل:", item);
                if (newValue) {
                  const updated = [...data];
                  updated[index] = newValue;
                  setData(updated);
                }
              }}
            >
              تعديل
            </button>

            <button
              onClick={() =>
                setData(data.filter((_: any, i: number) => i !== index))
              }
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}