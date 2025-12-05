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
    WITH ts AS (
      SELECT
        e.ID AS EmployerID,
        c.CompanyID,
        c.CName AS CompanyName,
        c.Logo,
        c.CompanySize,
        c.Website,
        c.Description,
        c.Industry,
        c.CNationality,
        fn_TinhDiemUyTinEmployer(e.ID) AS json_result
      FROM employer e
      LEFT JOIN company c ON c.EmployerID = e.ID
    )
    SELECT
      ts.CompanyID,
      ts.CompanyName,
      ts.Logo,
      ts.CompanySize,
      ts.Website,
      ts.Description,
      ts.Industry,
      ts.CNationality,
      CAST(JSON_EXTRACT(ts.json_result, '$.EmployerID') AS UNSIGNED) AS EmployerID,
      CAST(JSON_EXTRACT(ts.json_result, '$.OpenJobCount') AS UNSIGNED) AS openPositions,
      CAST(JSON_EXTRACT(ts.json_result, '$.TrustScore') AS DECIMAL(10,2)) AS TrustScore,
      CAST(JSON_EXTRACT(ts.json_result, '$.AvgReview') AS DECIMAL(10,2)) AS AvgReview,
      CAST(JSON_EXTRACT(ts.json_result, '$.TotalReview') AS UNSIGNED) AS TotalReview,
      CAST(JSON_EXTRACT(ts.json_result, '$.FollowerCount') AS UNSIGNED) AS FollowerCount
    FROM ts
    WHERE ts.CompanyID IS NOT NULL
    ORDER BY TrustScore DESC
    LIMIT ${safeLimit}
  `,
  );
};

module.exports = {
  fetchTopCompanies,
};

