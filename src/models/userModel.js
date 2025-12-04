const { executeQuery } = require('../config/database');

const baseQuery = `
  SELECT 
    u.*,
    c.ID AS CandidateID,
    e.ID AS EmployerID
  FROM user u
  LEFT JOIN candidate c ON c.ID = u.ID
  LEFT JOIN employer e ON e.ID = u.ID
`;

const getUserByEmail = async (email) => {
  const rows = await executeQuery(`${baseQuery} WHERE u.Email = ?`, [email]);
  return rows[0];
};

const getUserById = async (id) => {
  const rows = await executeQuery(`${baseQuery} WHERE u.ID = ?`, [id]);
  return rows[0];
};

const getUserByCandidateId = async (candidateId) => {
  const rows = await executeQuery(`${baseQuery} WHERE c.ID = ?`, [candidateId]);
  return rows[0];
};

const getUserByEmployerId = async (employerId) => {
  const rows = await executeQuery(`${baseQuery} WHERE e.ID = ?`, [employerId]);
  return rows[0];
};

const createUser = async (payload) => {
  const {
    Username,
    Email,
    Password,
    FName,
    LName,
    Address,
    Phonenumber,
    Profile_Picture,
    Bdate,
  } = payload;

  const result = await executeQuery(
    `
    INSERT INTO user (
      Username,
      Email,
      Password,
      FName,
      LName,
      Created_date,
      Address,
      Phonenumber,
      Profile_Picture,
      Bdate
    ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
  `,
    [Username, Email, Password, FName, LName, Address, Phonenumber, Profile_Picture, Bdate],
  );

  return result.insertId;
};

module.exports = {
  getUserByEmail,
  getUserById,
  getUserByCandidateId,
  getUserByEmployerId,
  createUser,
};

