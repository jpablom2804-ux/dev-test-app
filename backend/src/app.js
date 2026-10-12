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

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;


