// ==================================================
// DEPENDENCIAS
// ==================================================

// Express permite crear el router donde agrupamos
// todos los endpoints relacionados con productos.
const express = require("express");

// Importamos el pool de conexiones hacia MariaDB.
//
// En este archivo utilizamos pool.query() directamente
// porque las operaciones son consultas individuales
// y no necesitan una transacción.
const pool = require("../db");


// ==================================================
// ROUTER DE PRODUCTOS
// ==================================================

// Este router será montado desde server.js en:
//
// /api/products
//
// Por lo tanto:
//
// router.get("/")          → GET /api/products
// router.post("/")         → POST /api/products
// router.get("/:id")       → GET /api/products/:id
// router.put("/:id")       → PUT /api/products/:id
// router.delete("/:id")    → DELETE /api/products/:id
//
const router = express.Router();


// ==================================================
// VALIDACIÓN DE PRODUCTOS
// ==================================================
//
// Esta función centraliza las reglas que debe cumplir
// un producto antes de ser creado o actualizado.
//
// Devuelve:
//
// null
// → datos válidos
//
// "mensaje de error"
// → existe algún dato inválido
//
function validateProduct(product) {

    // Extraemos los campos que esperamos recibir
    // desde req.body.
    const {
        nombre,
        descripcion,
        precio,
        stock
    } = product;


    // ==================================================
    // VALIDAR NOMBRE
    // ==================================================

    // El nombre:
    //
    // - debe existir;
    // - debe ser texto;
    // - no puede contener únicamente espacios.
    if (
        !nombre ||
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        return "El nombre es obligatorio";
    }

    // La columna nombre de MariaDB admite
    // un máximo de 100 caracteres.
    if (nombre.trim().length > 100) {
        return "El nombre no puede superar 100 caracteres";
    }


    // ==================================================
    // VALIDAR DESCRIPCIÓN
    // ==================================================

    // La descripción es opcional.
    //
    // Pero si viene incluida debe ser texto.
    if (
        descripcion !== undefined &&
        descripcion !== null &&
        typeof descripcion !== "string"
    ) {
        return "La descripción debe ser texto";
    }

    // La columna descripcion permite
    // un máximo de 255 caracteres.
    if (
        descripcion &&
        descripcion.length > 255
    ) {
        return "La descripción no puede superar 255 caracteres";
    }


    // ==================================================
    // VALIDAR PRECIO
    // ==================================================

    // Los datos recibidos mediante JSON podrían venir
    // como número o como texto numérico.
    //
    // Number() intenta convertirlo a número.
    const precioNumero = Number(precio);

    // El precio:
    //
    // - debe existir;
    // - no puede estar vacío;
    // - debe poder convertirse a un número válido;
    // - no puede ser negativo.
    if (
        precio === undefined ||
        precio === null ||
        precio === "" ||
        !Number.isFinite(precioNumero) ||
        precioNumero < 0
    ) {
        return "El precio debe ser un número mayor o igual a 0";
    }


    // ==================================================
    // VALIDAR STOCK
    // ==================================================

    // Convertimos el stock recibido a número.
    const stockNumero = Number(stock);

    // El stock:
    //
    // - debe existir;
    // - no puede estar vacío;
    // - debe ser un número entero;
    // - no puede ser negativo.
    //
    // Por ejemplo:
    //
    // 10   → válido
    // 0    → válido
    // 2.5  → inválido
    // -1   → inválido
    if (
        stock === undefined ||
        stock === null ||
        stock === "" ||
        !Number.isInteger(stockNumero) ||
        stockNumero < 0
    ) {
        return "El stock debe ser un entero mayor o igual a 0";
    }


    // Si ninguna validación produjo un error,
    // el producto es válido.
    return null;
}


// ==================================================
// OBTENER PRODUCTOS ACTIVOS
// ==================================================
//
// GET /api/products
//
// Devuelve únicamente productos cuyo campo:
//
// activo = 1
//
router.get("/", async (req, res) => {

    try {

        // Obtenemos todos los productos activos.
        //
        // ORDER BY id DESC hace que los productos
        // creados más recientemente aparezcan primero.
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

        // Consulta exitosa.
        res.status(200).json(products);

    } catch (error) {

        // El error real se registra en el Backend.
        console.error(
            "Error obteniendo productos:",
            error
        );

        // Al cliente enviamos un mensaje genérico.
        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});


// ==================================================
// OBTENER PRODUCTOS ELIMINADOS
// ==================================================
//
// GET /api/products/deleted
//
// Nuestro sistema utiliza Soft Delete.
//
// Por lo tanto los productos eliminados
// siguen existiendo en MariaDB pero tienen:
//
// activo = 0
//
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


// ==================================================
// IMPORTANTE: ORDEN DE LAS RUTAS
// ==================================================
//
// /deleted debe declararse ANTES de /:id.
//
// Si /:id estuviera primero, Express podría interpretar:
//
// /api/products/deleted
//
// como:
//
// id = "deleted"
//
// Por eso primero se definen las rutas específicas
// y después las rutas dinámicas como /:id.


// ==================================================
// OBTENER PRODUCTO POR ID
// ==================================================
//
// GET /api/products/:id
//
// Ejemplo:
//
// GET /api/products/5
//
router.get("/:id", async (req, res) => {

    try {

        // req.params.id viene desde la URL.
        //
        // Ejemplo:
        //
        // /api/products/5
        //
        // req.params.id = "5"
        //
        // Por eso lo convertimos a Number.
        const id = Number(req.params.id);


        // ==================================================
        // VALIDAR ID
        // ==================================================

        // El ID debe ser:
        //
        // - entero;
        // - mayor que cero.
        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }


        // ==================================================
        // BUSCAR PRODUCTO
        // ==================================================

        // Utilizamos ? como parámetro SQL.
        //
        // Esto evita concatenar directamente
        // datos recibidos desde el cliente.
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


        // Si no encontramos ningún registro,
        // respondemos HTTP 404.
        if (products.length === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }


        // Como buscamos un único producto,
        // devolvemos el primer registro.
        res.status(200).json(
            products[0]
        );

    } catch (error) {

        console.error(
            "Error obteniendo producto:",
            error
        );

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});


// ==================================================
// CREAR PRODUCTO
// ==================================================
//
// POST /api/products
//
// Ejemplo de JSON:
//
// {
//   "nombre": "Mouse",
//   "descripcion": "Mouse inalámbrico",
//   "precio": 30,
//   "stock": 10
// }
//
router.post("/", async (req, res) => {

    try {

        // ==================================================
        // VALIDAR DATOS
        // ==================================================

        // Enviamos req.body a nuestra función
        // de validación.
        const validationError =
            validateProduct(req.body);

        // Si existe un error, respondemos 400
        // y no intentamos insertar nada.
        if (validationError) {
            return res.status(400).json({
                error: validationError
            });
        }


        // Extraemos los campos del JSON recibido.
        const {
            nombre,
            descripcion,
            precio,
            stock
        } = req.body;


        // ==================================================
        // INSERTAR EN MARIADB
        // ==================================================

        // La consulta utiliza parámetros ?
        // para evitar concatenar datos directamente.
        const result = await pool.query(`
            INSERT INTO products
            (
                nombre,
                descripcion,
                precio,
                stock
            )
            VALUES (?, ?, ?, ?)
        `, [

            // Eliminamos espacios al inicio
            // y final del nombre.
            nombre.trim(),

            // Si la descripción está vacía,
            // almacenamos NULL.
            descripcion?.trim() || null,

            // Normalizamos precio y stock
            // a valores numéricos.
            Number(precio),
            Number(stock)
        ]);


        // HTTP 201 = recurso creado correctamente.
        //
        // insertId contiene el ID generado
        // automáticamente por MariaDB.
        res.status(201).json({
            message:
                "Producto creado correctamente",

            id: Number(
                result.insertId
            )
        });

    } catch (error) {

        console.error(
            "Error creando producto:",
            error
        );

        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});


// ==================================================
// EDITAR PRODUCTO
// ==================================================
//
// PUT /api/products/:id
//
// Actualiza los datos de un producto activo.
//
router.put("/:id", async (req, res) => {

    try {

        // Obtenemos el ID desde la URL.
        const id =
            Number(req.params.id);


        // ==================================================
        // VALIDAR ID
        // ==================================================

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "El ID debe ser válido"
            });
        }


        // ==================================================
        // VALIDAR PRODUCTO
        // ==================================================

        const validationError =
            validateProduct(req.body);

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


        // ==================================================
        // ACTUALIZAR EN MARIADB
        // ==================================================

        // Solo actualizamos el producto si:
        //
        // - tiene el ID indicado;
        // - sigue activo.
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


        // affectedRows indica cuántos registros
        // fueron afectados por el UPDATE.
        //
        // Si es 0:
        //
        // - el producto no existe;
        // - o ya está eliminado.
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error:
                    "Producto no encontrado"
            });
        }


        res.status(200).json({
            message:
                "Producto actualizado correctamente"
        });

    } catch (error) {

        console.error(
            "Error actualizando producto:",
            error
        );

        res.status(500).json({
            error:
                "Error interno del servidor"
        });
    }
});


// ==================================================
// ELIMINAR PRODUCTO - SOFT DELETE
// ==================================================
//
// DELETE /api/products/:id
//
// No eliminamos físicamente la fila.
//
// En lugar de:
//
// DELETE FROM products
//
// hacemos:
//
// activo = 0
//
// Esto permite:
//
// - mantener historial;
// - restaurar productos;
// - evitar perder información.
//
router.delete("/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        // ==================================================
        // VALIDAR ID
        // ==================================================

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error:
                    "El ID debe ser válido"
            });
        }


        // ==================================================
        // MARCAR COMO ELIMINADO
        // ==================================================

        const result = await pool.query(`
            UPDATE products
            SET activo = 0
            WHERE id = ?
            AND activo = 1
        `, [id]);


        // Si no se modificó ningún registro,
        // el producto no existe o ya estaba eliminado.
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error:
                    "Producto no encontrado"
            });
        }


        res.status(200).json({
            message:
                "Producto movido a la papelera correctamente"
        });

    } catch (error) {

        console.error(
            "Error eliminando producto:",
            error
        );

        res.status(500).json({
            error:
                "Error interno del servidor"
        });
    }
});


// ==================================================
// RESTAURAR PRODUCTO
// ==================================================
//
// PATCH /api/products/:id/restore
//
// Un producto eliminado tiene:
//
// activo = 0
//
// Para restaurarlo simplemente cambiamos:
//
// activo = 1
//
router.patch(
    "/:id/restore",
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            // ==================================================
            // VALIDAR ID
            // ==================================================

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res.status(400).json({
                    error:
                        "El ID debe ser válido"
                });
            }


            // ==================================================
            // RESTAURAR EN MARIADB
            // ==================================================

            // Solo restauramos registros
            // que actualmente estén eliminados.
            const result =
                await pool.query(`
                    UPDATE products
                    SET activo = 1
                    WHERE id = ?
                    AND activo = 0
                `, [id]);


            // Si ninguna fila fue modificada,
            // no encontramos un producto eliminado
            // con ese ID.
            if (
                result.affectedRows === 0
            ) {
                return res.status(404).json({
                    error:
                        "Producto eliminado no encontrado"
                });
            }


            res.status(200).json({
                message:
                    "Producto restaurado correctamente"
            });

        } catch (error) {

            console.error(
                "Error restaurando producto:",
                error
            );

            res.status(500).json({
                error:
                    "Error interno del servidor"
            });
        }
    }
);


// ==================================================
// EXPORTAR ROUTER
// ==================================================

// Exportamos el router para utilizarlo
// desde server.js.
//
// Allí se monta con:
//
// app.use(
//   "/api/products",
//   authenticateToken,
//   productsRouter
// );
//
// Por eso todas estas rutas están protegidas
// por JWT antes de llegar a este archivo.
module.exports = router;