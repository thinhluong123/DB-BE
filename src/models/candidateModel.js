const { getPool } = require('../config/db');

async function createCandidate(id) {
  const pool = getPool();
  await pool.query('INSERT INTO candidate (ID) VALUES (?)', [id]);
}

async function exists(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT ID FROM candidate WHERE ID = ?', [id]);
  return rows.length > 0;
}

module.exports = {
  createCandidate,
  exists
};


