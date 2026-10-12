const HttpError = require("../errors/HttpError");

function notFound(req, res) {
  res.status(404).json({ error: "Recurso no encontrado" });
}

// Express reconoce el manejador de errores porque recibe 4 parámetros,
// por eso `next` debe declararse aunque no se use.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Error esperado: su mensaje está pensado para el cliente.
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Error inesperado: el detalle queda en el log y el cliente recibe un mensaje genérico.
  console.error(`Error en ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({ error: "Error interno del servidor" });
}

module.exports = { notFound, errorHandler };
