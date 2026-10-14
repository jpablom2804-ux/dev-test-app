// Debe cargarse antes que cualquier otro módulo:
// config.js lee process.env en el momento en que se importa.
require("dotenv").config();

// FLUJO LOGIN 1
// FLUJO PROD 1
// Puerta de entrada: el backend escucha en el puerto 3000 (app.listen, más abajo)
// y cada request que llega entra a `app`. Siguiente: Ctrl+clic en "./app".
const app = require("./app");
const pool = require("./db");
const { port, host } = require("./config");

const server = app.listen(port, host, () => {
  console.log(`Servidor ejecutándose en el puerto ${port}`);
});

// Docker envía SIGTERM al detener el contenedor:
// dejamos de aceptar peticiones y cerramos las conexiones a MariaDB.
process.on("SIGTERM", () => {
  server.close(() => pool.end());
});
