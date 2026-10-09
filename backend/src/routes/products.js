const express = require("express");
const pool = require("../db");

const router = express.Router();

function validateProduct(product) {
    const {
        nombre,
        descripcion,
        precio,
        stock
    } = product;

    if (
        !nombre ||
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        return "El nombre es obligatorio";
    }

    if (nombre.trim().length > 100) {
        return "El nombre no puede superar 100 caracteres";
    }

    if (
        descripcion !== undefined &&
        descripcion !== null &&
        typeof descripcion !== "string"
    ) {
        return "La descripción debe ser texto";
    }

    if (descripcion && descripcion.length > 255) {
        return "La descripción no puede superar 255 caracteres";
    }

    const precioNumero = Number(precio);

    if (
        precio === undefined ||
        precio === null ||
        precio === "" ||
        !Number.isFinite(precioNumero) ||
        precioNumero < 0
    ) {
        return "El precio debe ser un número mayor o igual a 0";
    }

    const stockNumero = Number(stock);

    if (
        stock === undefined ||
        stock === null ||
        stock === "" ||
        !Number.isInteger(stockNumero) ||
        stockNumero < 0
    ) {
        return "El stock debe ser un entero mayor o igual a 0";
    }

    return null;
}

// Obtener productos activos
router.get("/", async (req, res) => {
    try {
        const products = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion,
                precio,
                stock,
                created_at,
                updated_at
            FROM products
            WHERE activo = 1
            ORDER BY id DESC
        `);

        res.status(200).json(products);

    } catch (error) {
        console.error("Error obteniendo productos:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// Obtener productos eliminados
// IMPORTANTE: va antes de /:id
router.get("/deleted", async (req, res) => {
    try {
        const products = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion,
                precio,
                stock,
                created_at,
                updated_at
            FROM products
            WHERE activo = 0
            ORDER BY updated_at DESC
        `);

        res.status(200).json(products);

    } catch (error) {
        console.error(
            "Error obteniendo productos eliminados:",
            error
        );

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// Obtener producto activo por ID
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }

        const products = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion,
                precio,
                stock,
                created_at,
                updated_at
            FROM products
            WHERE id = ?
            AND activo = 1
        `, [id]);

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

// Crear producto
router.post("/", async (req, res) => {
    try {
        const validationError = validateProduct(req.body);

        if (validationError) {
            return res.status(400).json({
                error: validationError
            });
        }

        const {
            nombre,
            descripcion,
            precio,
            stock
        } = req.body;

        const result = await pool.query(`
            INSERT INTO products
            (nombre, descripcion, precio, stock)
            VALUES (?, ?, ?, ?)
        `, [
            nombre.trim(),
            descripcion?.trim() || null,
            Number(precio),
            Number(stock)
        ]);

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

// Editar producto activo
router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }

        const validationError = validateProduct(req.body);

        if (validationError) {
            return res.status(400).json({
                error: validationError
            });
        }

        const {
            nombre,
            descripcion,
            precio,
            stock
        } = req.body;

        const result = await pool.query(`
            UPDATE products
            SET
                nombre = ?,
                descripcion = ?,
                precio = ?,
                stock = ?
            WHERE id = ?
            AND activo = 1
        `, [
            nombre.trim(),
            descripcion?.trim() || null,
            Number(precio),
            Number(stock),
            id
        ]);

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

// Soft delete
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }

        const result = await pool.query(`
            UPDATE products
            SET activo = 0
            WHERE id = ?
            AND activo = 1
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto movido a la papelera correctamente"
        });

    } catch (error) {
        console.error("Error eliminando producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

// Restaurar producto
router.patch("/:id/restore", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }

        const result = await pool.query(`
            UPDATE products
            SET activo = 1
            WHERE id = ?
            AND activo = 0
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Producto eliminado no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto restaurado correctamente"
        });

    } catch (error) {
        console.error("Error restaurando producto:", error);

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

module.exports = router;