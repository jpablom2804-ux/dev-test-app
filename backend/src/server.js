const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const pool = require("./db");
const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const authenticateToken = require("./middleware/auth");

const app = express();

// Middlewares generales
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check público
app.get("/health", async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.query("SELECT 1");

        res.status(200).json({
            status: "ok",
            database: "connected"
        });

    } catch (error) {
        console.error("Error en health check:", error);

        res.status(500).json({
            status: "error",
            database: "disconnected"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Autenticación pública
app.use("/api/auth", authRouter);

// Productos protegidos con JWT
app.use(
    "/api/products",
    authenticateToken,
    productsRouter
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Servidor ejecutándose en el puerto ${PORT}`
    );
});