import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

 

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,            // 0 = unlimited queue
  timezone: "+05:30",       // IST — important for timestamps
});

// Test the connection when the server starts
export const connectMySQL = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected");
    conn.release(); // immediately give it back to the pool
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1); // crash the server — no point running without a DB
  }
};

/*
  HOW TO USE THIS IN OTHER FILES:
  ────────────────────────────────
  import pool from '../config/mysql.js';

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
  //     ↑
  //  mysql2 returns [rows, fields] — we only need rows
  //  The ? is a placeholder — mysql2 escapes it automatically (prevents SQL injection)
*/

export default pool;