require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise"); // Konsisten gunakan mysql2 dengan promise
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Konfigurasi Database
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 🏗️ Membuat Pool Connection
const pool = mysql.createPool(dbConfig);

// Test koneksi saat startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database terhubung ke Filess.io!");
    connection.release();
  } catch (err) {
    console.error("❌ Gagal koneksi database:", err.message);
  }
})();

// ✅ TEST API
app.get("/", (req, res) => {
  res.send("API Berjalan Lancar 🚀");
});

// 📌 1. GET semua resep
app.get("/all", async (req, res) => {
  try {
    const results = await Promise.all([
      pool.query("SELECT * FROM pegawai"),
      pool.query("SELECT * FROM barang"),
      pool.query("SELECT * FROM penjualan"),
      pool.query("SELECT * FROM penjualan_detail"),
      pool.query("SELECT * FROM pelanggan"),
    ]);

    res.json({
      pegawai: results[0][0],
      barang: results[1][0],
      penjualan: results[2][0],
      penjualan_detail: results[3][0],
      pelanggan: results[4][0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 2. GET resep by ID
app.get("/resep/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM resep_ayam WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 3. Endpoint khusus untuk AI (clean text)
app.get("/resep-ai", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM resep_ayam");

    const formatted = rows.map((item) => ({
      id: item.id,
      title: item.title,
      content: `Judul: ${item.title}\nIngredients: ${item.ingredients}\nSteps: ${item.steps}`,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 RUN SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
