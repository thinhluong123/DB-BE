const { getPool } = require('../config/db');

async function createEmployer(id, packageName) {
  const pool = getPool();
  await pool.query(
    'INSERT INTO employer (ID, PackageName, NumberOfOpenedJob) VALUES (?, ?, 0)',
    [id, packageName]
  );
}

async function exists(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT ID FROM employer WHERE ID = ?', [id]);
  return rows.length > 0;
}

module.exports = {
  createEmployer,
  exists
};


