function getPagination(query, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = {
  getPagination
};


