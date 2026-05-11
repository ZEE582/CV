const express = require("express");
const path = require("path");
const chalk = require("chalk");
const companyData = require("./data/company-data.json");

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// HTML view: must be registered before static so it wins over public/products/
app.get("/ttwar", (req, res) => {
  console.log(companyData.companies);
  res.render("ttwar", { companies: companyData.companies });
});

// Serve static HTML files
app.use(express.static(path.join(__dirname, "public")));

let nextId = 43;

/* ------------------------
   CRUD API
-------------------------*/

// Get all companies
app.get("/api/company", (req, res) => {
  res.json({ companies: companyData.companies });
});

// Get one company
app.get("/api/company/:id", (req, res) => {
  const company = companyData.companies.find(p => p.id === Number(req.params.id));
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }
  res.json(company);
});

// Create company
app.post("/api/company", (req, res) => {
  const { name, city } = req.body;

  const product = {
    id: nextId++,
    name,
    city,
    company_logo: "",
    company_name: "",
    tech_stack: {
      tech_stack: [],
      backend: [],
      frontend: [],
      mobile: [],
      database: [],
      devops: [],
      programming_languages: []
    },
    website: ""
  };

  // FIX 1: was `company` (undefined) — should be `product`
  companyData.companies.push(product);
  res.status(201).json(product);
});

// Update company
app.put("/api/company/:id", (req, res) => {
  const company = companyData.companies.find(c => c.id === Number(req.params.id));

  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }

  // FIX 2: inverted nullish coalescing — incoming value takes priority
  company.name         = req.body.name         ?? company.name;
  company.city         = req.body.city         ?? company.city;
  company.company_logo = req.body.company_logo ?? company.company_logo;
  company.company_name = req.body.company_name ?? company.company_name;
  company.tech_stack   = req.body.tech_stack   ?? company.tech_stack;

  companyData.companies[companyData.companies.indexOf(company)] = company;
  res.json(company);
});

// Delete company
app.delete("/api/company/:id", (req, res) => {
  const index = companyData.companies.findIndex(p => p.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Company not found" });
  }

  const deleted = companyData.companies.splice(index, 1);
  res.json(deleted[0]);
});

/* ------------------------ */

app.listen(PORT, () => {
  console.log(chalk.green(`Server running on http://localhost:${PORT}`));
});