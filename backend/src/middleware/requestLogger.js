// Registra método, URL, código de respuesta y duración de cada petición.
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs} ms)`
    );
  });

  next();
}

module.exports = requestLogger;
