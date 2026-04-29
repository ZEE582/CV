const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "qwertyuio",
  database: "auth_db",
  port: 3307,
});

module.exports = pool;