// src/data/mockData.ts

export const mockBarData = [
  {
    country: "USA",
    "hot dog": 120,
    burger: 80,
    sandwich: 60,
    kebab: 90,
    fries: 150,
    donut: 40,
  },
  {
    country: "Germany",
    "hot dog": 90,
    burger: 110,
    sandwich: 70,
    kebab: 50,
    fries: 100,
    donut: 60,
  },
];

export const mockLineData = [
  {
    id: "sales",
    data: [
      { x: "Jan", y: 100 },
      { x: "Feb", y: 200 },
      { x: "Mar", y: 150 },
      { x: "Apr", y: 300 },
    ],
  },
];

export const mockTransactions = [
  {
    txId: "TX001",
    user: "Nada",
    date: "2026-05-01",
    cost: 120,
  },
  {
    txId: "TX002",
    user: "Ali",
    date: "2026-05-02",
    cost: 90,
  },
];

export const mockDataTeam = [
  {
    id: 1,
    name: "Admin User",
    age: 30,
    phone: "0591234567",
    email: "admin@test.com",
    access: "admin",
  },
];

export const mockDataContacts = [
  {
    id: 1,
    name: "User One",
    age: 25,
    phone: "0591111111",
    email: "u1@test.com",
    address: "Ramallah",
    city: "Ramallah",
    zipCode: "0000",
  },
];

export const mockDataInvoices = [
  {
    id: 1,
    name: "Invoice 1",
    phone: "0590000000",
    email: "inv@test.com",
    cost: 200,
    date: "2026-05-01",
  },
];