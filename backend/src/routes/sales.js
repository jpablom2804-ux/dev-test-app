const express = require("express");
const pool = require("../db");

const router = express.Router();

/*
 * POST /api/sales
 * Registra una venta y descuenta el stock.
 */
router.post("/", async (req, res) => {
  const { product_id, cantidad } = req.body;

  const productId = Number(product_id);
  const quantity = Number(cantidad);

  // Validaciones básicas
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      error: "El producto es inválido",
    });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      error: "La cantidad debe ser un número entero mayor que 0",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    /*
     * Iniciamos una transacción.
     *
     * Esto permite que:
     * - guardar la venta
     * - descontar el stock
     *
     * se comporten como una sola operación.
     */
    await connection.beginTransaction();

    /*
     * FOR UPDATE bloquea temporalmente este producto
     * mientras hacemos la venta.
     */
    const products = await connection.query(
      `SELECT id, nombre, precio, stock, activo
       FROM products
       WHERE id = ?
       FOR UPDATE`,
      [productId]
    );

    if (products.length === 0 || Number(products[0].activo) !== 1) {
      await connection.rollback();

      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }

    const product = products[0];

    /*
     * No permitimos vender más unidades
     * de las disponibles.
     */
    if (Number(product.stock) < quantity) {
      await connection.rollback();

      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${product.stock}`,
      });
    }

    /*
     * Guardamos el precio actual dentro de la venta.
     * Así una venta histórica no cambia si después
     * modificamos el precio del producto.
     */
    const result = await connection.query(
      `INSERT INTO sales
       (product_id, cantidad, precio_unitario)
       VALUES (?, ?, ?)`,
      [productId, quantity, product.precio]
    );

    /*
     * Descontamos las unidades vendidas.
     */
    await connection.query(
      `UPDATE products
       SET stock = stock - ?
       WHERE id = ?`,
      [quantity, productId]
    );

    /*
     * Todo salió bien.
     * Confirmamos ambas operaciones.
     */
    await connection.commit();

    return res.status(201).json({
      message: "Venta registrada correctamente",
      sale: {
        id: Number(result.insertId),
        product_id: productId,
        producto: product.nombre,
        cantidad: quantity,
        precio_unitario: Number(product.precio),
        stock_restante: Number(product.stock) - quantity,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error haciendo rollback:", rollbackError);
      }
    }

    console.error("Error registrando venta:", error);

    return res.status(500).json({
      error: "Error interno al registrar la venta",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/*
 * GET /api/sales/summary
 * Devuelve información para el Dashboard.
 */
router.get("/summary", async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Total de unidades vendidas
    const totals = await connection.query(`
      SELECT
        COALESCE(SUM(cantidad), 0) AS unidades_vendidas
      FROM sales
    `);

    // Productos más vendidos
    const topProducts = await connection.query(`
      SELECT
        p.id,
        p.nombre,
        SUM(s.cantidad) AS unidades_vendidas
      FROM sales s
      INNER JOIN products p
        ON p.id = s.product_id
      GROUP BY p.id, p.nombre
      ORDER BY unidades_vendidas DESC, p.nombre ASC
      LIMIT 5
    `);

    // Últimas ventas realizadas
    const recentSales = await connection.query(`
      SELECT
        s.id,
        s.product_id,
        p.nombre AS producto,
        s.cantidad,
        s.precio_unitario,
        s.created_at
      FROM sales s
      INNER JOIN products p
        ON p.id = s.product_id
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 5
    `);

    return res.status(200).json({
      unidades_vendidas: Number(totals[0].unidades_vendidas),
      productos_mas_vendidos: topProducts.map((product) => ({
        ...product,
        unidades_vendidas: Number(product.unidades_vendidas),
      })),
      ventas_recientes: recentSales.map((sale) => ({
        ...sale,
        cantidad: Number(sale.cantidad),
        precio_unitario: Number(sale.precio_unitario),
      })),
    });
  } catch (error) {
    console.error("Error consultando resumen de ventas:", error);

    return res.status(500).json({
      error: "Error interno al consultar las ventas",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/*
 * GET /api/sales
 * Lista ventas.
 */
router.get("/", async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const sales = await connection.query(`
      SELECT
        s.id,
        s.product_id,
        p.nombre AS producto,
        s.cantidad,
        s.precio_unitario,
        s.created_at
      FROM sales s
      INNER JOIN products p
        ON p.id = s.product_id
      ORDER BY s.created_at DESC, s.id DESC
    `);

    return res.status(200).json(
      sales.map((sale) => ({
        ...sale,
        cantidad: Number(sale.cantidad),
        precio_unitario: Number(sale.precio_unitario),
      }))
    );
  } catch (error) {
    console.error("Error consultando ventas:", error);

    return res.status(500).json({
      error: "Error interno al consultar las ventas",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;