const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let pool;

async function initDb() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'btl2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  });

  // Simple test
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();

  // eslint-disable-next-line no-console
  console.log('MySQL pool created');

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('DB pool not initialized. Call initDb() first.');
  }
  return pool;
}

module.exports = {
  initDb,
  getPool
};


