const { executeQuery } = require('../config/database');

const toSafeLimit = (value, fallback = 8) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const fetchTopCompanies = (limit = 8) => {
  const safeLimit = toSafeLimit(limit);
  return executeQuery(
    `
    SELECT
      c.CompanyID,
      c.CName AS CompanyName,
      c.Logo,
      c.CompanySize,
      c.Website,
      c.Description,
      c.Industry,
      c.CNationality,
      COUNT(DISTINCT CASE WHEN j.JobStatus IN ('OPEN', 'Active') AND j.ExpireDate >= CURDATE() THEN j.JobID END) AS openPositions,
      ROUND(AVG(r.Rank), 1) AS rating
    FROM company c
    LEFT JOIN employer e ON e.ID = c.EmployerID
    LEFT JOIN job j ON j.EmployerID = e.ID
    LEFT JOIN review r ON r.EmployerID = e.ID
    GROUP BY c.CompanyID
    ORDER BY rating IS NULL, rating DESC, openPositions DESC
    LIMIT ${safeLimit}
  `,
  );
};

module.exports = {
  fetchTopCompanies,
};

