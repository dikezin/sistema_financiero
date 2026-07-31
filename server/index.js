import "dotenv/config";
import cors from "cors";
import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = Number(process.env.API_PORT || 3001);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ database: "connected" });
  } catch (error) {
    console.error("MySQL health check failed:", error.message);
    response.status(500).json({ database: "disconnected" });
  }
});

app.get("/api/movimientos", async (request, response) => {
  const cuenta = String(request.query.cuenta ?? "").trim();

  try {
    const [rows] = await pool.execute(
      `SELECT cuenta, monto, fecha
       FROM movimientos
       WHERE cuenta LIKE ?
       ORDER BY fecha DESC`,
      [`%${cuenta}%`]
    );

    response.json(rows);
  } catch (error) {
    console.error("Movements query failed:", error.message);
    response.status(500).json({ error: "No se pudieron consultar los movimientos." });
  }
});

app.listen(port, () => {
  console.log(`API ejecutándose en http://localhost:${port}`);
});