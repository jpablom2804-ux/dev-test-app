// Configuración de la aplicación. Es el único módulo que lee process.env:
// el resto recibe los valores desde aquí.
module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",

  // Nombre de la cookie que guarda el JWT de la sesión.
  authCookieName: "auth_token",
  // En producción con HTTPS debe ser "true" para que la cookie solo viaje cifrada.
  cookieSecure: process.env.COOKIE_SECURE === "true",
};
