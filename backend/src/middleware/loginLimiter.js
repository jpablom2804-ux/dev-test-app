const rateLimit = require("express-rate-limit");

// Limita los intentos de login fallidos para frenar ataques de fuerza bruta:
// máximo 5 cada 15 minutos. Los logins correctos no cuentan.
// FLUJO 5 · Solo en POST /api/auth/login: con 5 fallos responde 429 aquí mismo
// y la request no sigue. Si no, pasa al controller (authController.login).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.",
  },
});

module.exports = loginLimiter;
