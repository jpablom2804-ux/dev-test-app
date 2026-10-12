// Error esperado cuyo mensaje se puede mostrar al cliente,
// por ejemplo datos inválidos (400) o un recurso inexistente (404).
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
