module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error:   err.message || 'Internal server error',
    code:    err.code    || 'INTERNAL_ERROR',
  });
};
