// ── Prisma error codes reference ───────────────────────────────────────────
// P2002 = Unique constraint violation  (e.g., email already exists)
// P2003 = Foreign key constraint fail  (e.g., questionId doesn't exist)
// P2025 = Record not found             (e.g., update on non-existent row)
// P2000 = Value too long for column

module.exports = (err, req, res, next) => {
  // ── Zod validation errors ───────────────────────────────────────────────
  // Thrown by schema.parse() in routes that use zod validation
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error:   'Validation failed',
      code:    'VALIDATION_ERROR',
      issues:  err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // ── Prisma known request errors ─────────────────────────────────────────
  if (err.code?.startsWith('P2')) {
    const prismaErrors = {
      P2002: { status: 409, error: 'A record with this value already exists', code: 'DUPLICATE_ENTRY' },
      P2003: { status: 400, error: 'Referenced record does not exist',        code: 'FOREIGN_KEY_ERROR' },
      P2025: { status: 404, error: 'Record not found',                        code: 'NOT_FOUND' },
      P2000: { status: 400, error: 'Input value is too long',                 code: 'VALUE_TOO_LONG' },
    };
    const mapped = prismaErrors[err.code];
    if (mapped) {
      return res.status(mapped.status).json({ success: false, ...mapped });
    }
  }

  // ── JWT errors (in case they escape middleware) ─────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // ── Generic fallback ────────────────────────────────────────────────────
  // Log full error in dev; hide internals in production
  if (process.env.NODE_ENV !== 'production') console.error(err);

  res.status(err.status || 500).json({
    success: false,
    error:   err.message || 'Internal server error',
    code:    err.code    || 'INTERNAL_ERROR',
  });
};
