const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const productsRouter = require("./routes/products");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query("SELECT 1");
        connection.release();

        res.status(200).json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
    }
});

app.use("/api/products", productsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
