export function notFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

// Express recognizes error handlers by their 4 parameters, so keep `next`
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  const status = err.status || 500;

  if (!err.status) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({
    error: err.status ? err.message : "Something went wrong",
  });
}
