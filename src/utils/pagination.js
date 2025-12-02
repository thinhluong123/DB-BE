const normalizeNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const getPaginationParams = (query) => {
  const page = normalizeNumber(query.page, 1);
  const limit = normalizeNumber(query.limit, 10);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    current_page: page,
    total_pages: totalPages,
    total_jobs: total,
    per_page: limit,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationMeta,
};