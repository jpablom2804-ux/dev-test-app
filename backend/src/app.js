const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const requestLogger = require("./middleware/requestLogger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

// La aplicación está detrás de Nginx: sin esto, el rate limiter
// vería la IP del proxy en lugar de la IP real del cliente.
app.set("trust proxy", 1);

// FLUJO 2 · Filtros que corren en todas las requests, en este orden:
// log, CORS, JSON → req.body y cookies → req.cookies.
app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Siguiente: Ctrl+clic en "./routes" (línea 7) → routes/index.js.
app.use(routes);

// FLUJO · Errores: cualquier error lanzado más adelante termina en errorHandler.
// Ctrl+clic en "./middleware/errorHandler" (línea 6).
app.use(notFound);
app.use(errorHandler);

module.exports = app;


