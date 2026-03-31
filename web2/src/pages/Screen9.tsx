import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Screen9() {

  const [page, setPage] = useState("stats");

  const [users, setUsers] = useState([
    { name: "أحمد", email: "ahmad@gmail.com" },
    { name: "سارة", email: "sara@gmail.com" }
  ]);

  const [companies, setCompanies] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [companyName, setCompanyName] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobCompany, setJobCompany] = useState("");

  const menu = [
    { key: "stats", name: "الإحصائيات", icon: "📊" },
    { key: "users", name: "المستخدمين", icon: "👤" },
    { key: "companies", name: "الشركات", icon: "🏢" },
    { key: "jobs", name: "الوظائف", icon: "💼" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f172a] text-white">

      <Navbar />

      <div className="flex p-6 gap-6">

        {/* Sidebar */}
        <div className="w-56 bg-[#1e1b4b] rounded-xl p-4 space-y-3">

          {menu.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full py-2 rounded flex items-center gap-2 px-3 transition
              ${page === item.key
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                  : "bg-[#2d2a6d] hover:bg-[#3b3790]"
                }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}

        </div>

        {/* Content */}
        <div className="flex-1 bg-[#111827] rounded-xl p-6 transition">

          {/* Stats */}
          {page === "stats" && (
            <div>
              <h2 className="text-2xl mb-6 text-indigo-400">📊 الإحصائيات</h2>

              <div className="grid grid-cols-3 gap-4">

                <div className="bg-[#1f2937] p-5 rounded-lg text-center hover:scale-105 transition">
                  <p>عدد المستخدمين</p>
                  <h3 className="text-xl">{users.length}</h3>
                </div>

                <div className="bg-[#1f2937] p-5 rounded-lg text-center hover:scale-105 transition">
                  <p>عدد الشركات</p>
                  <h3 className="text-xl">{companies.length}</h3>
                </div>

                <div className="bg-[#1f2937] p-5 rounded-lg text-center hover:scale-105 transition">
                  <p>عدد الوظائف</p>
                  <h3 className="text-xl">{jobs.length}</h3>
                </div>

              </div>
            </div>
          )}

          {/* Users */}
          {page === "users" && (
            <div>
              <h2 className="text-2xl mb-4 text-indigo-400">👤 المستخدمين</h2>

              {users.map((u, i) => (
                <div key={i} className="flex justify-between bg-[#1f2937] p-3 rounded mb-2 hover:bg-[#2a3441] transition">
                  <span>{u.name} - {u.email}</span>

                  <button
                    onClick={() => setUsers(users.filter((_, index) => index !== i))}
                    className="text-red-400 hover:underline"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Companies */}
          {page === "companies" && (
            <div>
              <h2 className="text-2xl mb-4 text-indigo-400">🏢 الشركات</h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="اسم الشركة"
                  className="p-2 rounded text-black w-full"
                />

                <button
                  onClick={() => {
                    if (companyName) {
                      setCompanies([...companies, companyName]);
                      setCompanyName("");
                    }
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 rounded hover:opacity-90"
                >
                  إضافة
                </button>
              </div>

              {companies.map((c, i) => (
                <div key={i} className="flex justify-between bg-[#1f2937] p-3 rounded mb-2 hover:bg-[#2a3441] transition">
                  <span>{c}</span>

                  <button
                    onClick={() => setCompanies(companies.filter((_, index) => index !== i))}
                    className="text-red-400"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Jobs */}
          {page === "jobs" && (
            <div>
              <h2 className="text-2xl mb-4 text-indigo-400">💼 الوظائف</h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="اسم الوظيفة"
                  className="p-2 rounded text-black w-full"
                />

                <select
                  onChange={(e) => setJobCompany(e.target.value)}
                  className="p-2 rounded text-black"
                >
                  <option>اختر شركة</option>
                  {companies.map((c, i) => (
                    <option key={i}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (jobName && jobCompany) {
                      setJobs([...jobs, { name: jobName, company: jobCompany }]);
                      setJobName("");
                    }
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 rounded hover:opacity-90"
                >
                  إضافة
                </button>
              </div>

              {jobs.map((j, i) => (
                <div key={i} className="flex justify-between bg-[#1f2937] p-3 rounded mb-2 hover:bg-[#2a3441] transition">
                  <span>{j.name} - {j.company}</span>

                  <button
                    onClick={() => setJobs(jobs.filter((_, index) => index !== i))}
                    className="text-red-400"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}