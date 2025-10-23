export function errorHandler(err, req, res, next) {
  if (err.code && err.message) {
    return res.status(err.code).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error" });
}
