export function errorHandler(err, req, res, next) {
  console.error("ERROR HANDLER:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    details: err.details || null,
    hint: err.hint || null,
    code: err.code || null,
  });
}