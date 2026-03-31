import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Screen9() {

  const [page, setPage] = useState("users");

  const [users, setUsers] = useState([
    { name: "أحمد", email: "ahmad@gmail.com" },
    { name: "سارة", email: "sara@gmail.com" }
  ]);

  const [companies, setCompanies] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [companyName, setCompanyName] = useState("");
  const [jobName, setJobName] = useState("");
  const [jobCompany, setJobCompany] = useState("");

  return (
    <div dir="rtl">

      <Navbar />

      <div style={{ display: "flex", marginTop: "20px" }}>

        {/* القائمة */}
        <div style={{ width: "200px" }}>
          <button onClick={() => setPage("users")}>المستخدمين</button><br />
          <button onClick={() => setPage("companies")}>الشركات</button><br />
          <button onClick={() => setPage("jobs")}>الوظائف</button><br />
          <button onClick={() => setPage("stats")}>إحصائيات</button>
        </div>

        {/* المحتوى */}
        <div style={{ marginRight: "20px" }}>

          {/* المستخدمين */}
          {page === "users" && (
            <div>
              <h3>المستخدمين</h3>

              {users.map((u, i) => (
                <div key={i}>
                  {u.name} - {u.email}
                  <button onClick={() => {
                    setUsers(users.filter((_, index) => index !== i));
                  }}>
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* الشركات */}
          {page === "companies" && (
            <div>
              <h3>الشركات</h3>

              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="اسم الشركة"
              />

              <button onClick={() => {
                if (companyName !== "") {
                  setCompanies([...companies, companyName]);
                  setCompanyName("");
                }
              }}>
                إضافة
              </button>

              {companies.map((c, i) => (
                <div key={i}>
                  {c}
                  <button onClick={() => {
                    setCompanies(companies.filter((_, index) => index !== i));
                  }}>
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* الوظائف */}
          {page === "jobs" && (
            <div>
              <h3>الوظائف</h3>

              <input
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="اسم الوظيفة"
              />

              <select onChange={(e) => setJobCompany(e.target.value)}>
                <option>اختر شركة</option>
                {companies.map((c, i) => (
                  <option key={i}>{c}</option>
                ))}
              </select>

              <button onClick={() => {
                if (jobName !== "" && jobCompany !== "") {
                  setJobs([...jobs, { name: jobName, company: jobCompany }]);
                  setJobName("");
                }
              }}>
                إضافة
              </button>

              {jobs.map((j, i) => (
                <div key={i}>
                  {j.name} - {j.company}
                  <button onClick={() => {
                    setJobs(jobs.filter((_, index) => index !== i));
                  }}>
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* الإحصائيات */}
          {page === "stats" && (
            <div>
              <h3>إحصائيات</h3>
              <p>عدد المستخدمين: {users.length}</p>
              <p>عدد الشركات: {companies.length}</p>
              <p>عدد الوظائف: {jobs.length}</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}