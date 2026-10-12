const HttpError = require("../errors/HttpError");

// Convierte un valor recibido (de la URL o del body, a veces como texto)
// en un entero positivo, o lanza 400 con el mensaje indicado.
function parsePositiveInt(rawValue, errorMessage) {
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, errorMessage);
  }

  return value;
}

module.exports = {
  parsePositiveInt,
};
