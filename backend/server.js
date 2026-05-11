const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const team = [
  {
    id: 1,
    name: "Yousef",
    age: 20,
    phone: "0594444444",
    email: "yousef@gmail.com",
    access: "Leader",
    role: "Back-End Developer",
    image:
      "https://api.dicebear.com/7.x/personas/svg?seed=Jack&backgroundColor=3b82f6",
  },

  {
    id: 2,
    name: "Nada Nour",
    age: 20,
    phone: "0591111111",
    email: "nada@gmail.com",
    access: "Team Member",
    role: "Front-End Developer",
    image:
      "https://api.dicebear.com/7.x/personas/svg?seed=Amelia1&backgroundColor=a855f7",
  },

  {
    id: 3,
    name: "Sura",
    age: 20,
    phone: "0592222222",
    email: "sura@gmail.com",
    access: "Team Member",
    role: "UI/UX Designer",
    image:
      "https://api.dicebear.com/7.x/personas/svg?seed=OliviaGirl&backgroundColor=ec4899",
  },

  {
    id: 4,
    name: "Waseem",
    age: 20,
    phone: "0593333333",
    email: "waseem@gmail.com",
    access: "Team Member",
    role: "Front-End Developer",
    image:
      "https://api.dicebear.com/7.x/personas/svg?seed=Michael&backgroundColor=06b6d4",
  },

  {
    id: 5,
    name: "Abeer",
    age: 20,
    phone: "0595555555",
    email: "abeer@gmail.com",
    access: "Team Member",
    role: "Database Manager",
    image:
      "https://api.dicebear.com/7.x/personas/svg?seed=Amelia3&backgroundColor=f43f5e",
  },
];

const contacts = [
  {
    id: 1,
    name: "Yousef",
    role: "Leader",
    age: 20,
    phone: "0594444444",
    email: "yousef@gmail.com",
    address: "Nablus",
  },

  {
    id: 2,
    name: "Nada Nour",
    role: "Team Member",
    age: 20,
    phone: "0591111111",
    email: "nada@gmail.com",
    address: "Nablus",
  },

  {
    id: 3,
    name: "Sura",
    role: "Team Member",
    age: 20,
    phone: "0592222222",
    email: "sura@gmail.com",
    address: "Nablus",
  },

  {
    id: 4,
    name: "Waseem",
    role: "Team Member",
    age: 20,
    phone: "0593333333",
    email: "waseem@gmail.com",
    address: "Nablus",
  },

  {
    id: 5,
    name: "Abeer",
    role: "Team Member",
    age: 20,
    phone: "0595555555",
    email: "abeer@gmail.com",
    address: "Nablus",
  },
];

let events = [
  {
    id: "1",
    title: "Team Meeting",
    date: "2026-05-10",
    color: "#4caf50",
  },

  {
    id: "2",
    title: "CV Review",
    date: "2026-05-12",
    color: "#2196f3",
  },

  {
    id: "3",
    title: "Project Deadline",
    date: "2026-05-15",
    color: "#f44336",
  },
];

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/team", (req, res) => {
  res.json(team);
});

app.get("/contacts", (req, res) => {
  res.json(contacts);
});

app.get("/events", (req, res) => {
  res.json(events);
});

app.post("/events", (req, res) => {
  const newEvent = req.body;
  events.push(newEvent);
  res.json(newEvent);
});

app.delete("/events/:id", (req, res) => {
  events = events.filter((event) => event.id !== req.params.id);
  res.json({ message: "Event deleted" });
});

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});