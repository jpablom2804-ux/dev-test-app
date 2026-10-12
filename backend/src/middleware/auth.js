const jwt = require("jsonwebtoken");

const { authCookieName, jwtSecret } = require("../config");
const HttpError = require("../errors/HttpError");

// Protege una ruta: exige un JWT válido en la cookie de sesión y deja
// su contenido ({ userId, username, role }) en req.user.
// Los errores que lanza llegan al errorHandler como cualquier otro.
function authenticateToken(req, res, next) {
  const token = req.cookies?.[authCookieName];

  if (!token) {
    throw new HttpError(401, "No autenticado");
  }

  try {
    // Falla si la firma no coincide (token modificado) o si ya expiró.
    req.user = jwt.verify(token, jwtSecret);
  } catch {
    throw new HttpError(401, "Token inválido o expirado");
  }

  next();
}

module.exports = authenticateToken;
