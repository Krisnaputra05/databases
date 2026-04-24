require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Create connection pool
const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL || {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database terhubung!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal koneksi database:', err.message);
  });

// ✅ TEST API
app.get('/', (req, res) => {
  res.send('API jalan 🚀');
});

// 📌 1. GET semua resep (untuk AI / chunking)
app.get('/resep', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resep_ayam');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 2. GET resep by ID
app.get('/resep/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM resep_ayam WHERE id = ?',
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 3. Endpoint khusus untuk AI (clean text)
app.get('/resep-ai', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resep_ayam');

    const formatted = rows.map(item => ({
      id: item.id,
      title: item.title,
      content: `
Judul: ${item.title}
Ingredients: ${item.ingredients}
Steps: ${item.steps}
      `.trim()
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