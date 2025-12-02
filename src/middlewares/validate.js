function validatePaginationParams(req, res, next) {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  if (Number.isNaN(page) || Number.isNaN(limit) || page <= 0 || limit <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters'
    });
  }

  return next();
}

module.exports = {
  validatePaginationParams
};


