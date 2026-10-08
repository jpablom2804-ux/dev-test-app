const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/products
// Obtener todos los productos
router.get("/", async (req, res) => {
    try {
        const products = await pool.query(
            "SELECT id, nombre, descripcion, precio, stock FROM products ORDER BY id"
        );

        res.status(200).json(products);
    } catch (error) {
        console.error("Error obteniendo productos:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// GET /api/products/:id
// Obtener un producto por ID
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser un número válido"
            });
        }

        const products = await pool.query(
            "SELECT id, nombre, descripcion, precio, stock FROM products WHERE id = ?",
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json(products[0]);
    } catch (error) {
        console.error("Error obteniendo producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// POST /api/products
// Crear producto
router.post("/", async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock } = req.body;

        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({
                error: "El nombre es obligatorio"
            });
        }

        const precioNumero = Number(precio);
        const stockNumero = Number(stock);

        if (!Number.isFinite(precioNumero) || precioNumero < 0) {
            return res.status(400).json({
                error: "El precio debe ser un número mayor o igual a 0"
            });
        }

        if (!Number.isInteger(stockNumero) || stockNumero < 0) {
            return res.status(400).json({
                error: "El stock debe ser un entero mayor o igual a 0"
            });
        }

        const result = await pool.query(
            `INSERT INTO products
             (nombre, descripcion, precio, stock)
             VALUES (?, ?, ?, ?)`,
            [
                nombre.trim(),
                descripcion || null,
                precioNumero,
                stockNumero
            ]
        );

        res.status(201).json({
            message: "Producto creado correctamente",
            id: Number(result.insertId)
        });
    } catch (error) {
        console.error("Error creando producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// PUT /api/products/:id
// Modificar producto
router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre, descripcion, precio, stock } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser un número válido"
            });
        }

        if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({
                error: "El nombre es obligatorio"
            });
        }

        const precioNumero = Number(precio);
        const stockNumero = Number(stock);

        if (!Number.isFinite(precioNumero) || precioNumero < 0) {
            return res.status(400).json({
                error: "El precio debe ser un número mayor o igual a 0"
            });
        }

        if (!Number.isInteger(stockNumero) || stockNumero < 0) {
            return res.status(400).json({
                error: "El stock debe ser un entero mayor o igual a 0"
            });
        }

        const result = await pool.query(
            `UPDATE products
             SET nombre = ?, descripcion = ?, precio = ?, stock = ?
             WHERE id = ?`,
            [
                nombre.trim(),
                descripcion || null,
                precioNumero,
                stockNumero,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto actualizado correctamente"
        });
    } catch (error) {
        console.error("Error actualizando producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// DELETE /api/products/:id
// Eliminar producto
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser un número válido"
            });
        }

        const result = await pool.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto eliminado correctamente"
        });
    } catch (error) {
        console.error("Error eliminando producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

module.exports = router;
