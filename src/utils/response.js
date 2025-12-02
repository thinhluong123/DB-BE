const successResponse = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });

const paginatedResponse = (res, data, pagination, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    data,
    pagination,
    message,
  });

const errorResponse = (res, statusCode, message = 'Something went wrong', errors = undefined) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse,
};

