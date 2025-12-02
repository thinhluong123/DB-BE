const { getPool } = require('../config/db');

async function findByEmail(email) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM `user` WHERE Email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM `user` WHERE ID = ?', [id]);
  return rows[0] || null;
}

async function createUser(data) {
  const pool = getPool();
  const {
    Username,
    Email,
    Password,
    FName,
    LName,
    Address,
    Phonenume,
    Profile_Picture,
    Bdate
  } = data;

  const [result] = await pool.query(
    `INSERT INTO \`user\`
      (Username, Email, Password, FName, LName, Created_date, Address, Phonenume, Profile_Picture, Bdate)
     VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
    [Username, Email, Password, FName, LName, Address, Phonenume, Profile_Picture, Bdate]
  );
  return { id: result.insertId };
}

module.exports = {
  findByEmail,
  findById,
  createUser
};


