// ==================================================
// DEPENDENCIAS
// ==================================================

// Express permite crear el router que agrupa
// todos los endpoints relacionados con ventas.
const express = require("express");

// Pool de conexiones hacia MariaDB.
const pool = require("../db");


// ==================================================
// ROUTER DE VENTAS
// ==================================================

// Este router se monta desde server.js en:
//
// /api/sales
//
// Por lo tanto:
//
// router.post("/")      → POST /api/sales
// router.get("/")       → GET  /api/sales
// router.get("/summary")→ GET  /api/sales/summary
//
// En server.js todas estas rutas pasan primero por
// authenticateToken, por lo que están protegidas
// mediante JWT.
const router = express.Router();


// ==================================================
// REGISTRAR UNA VENTA
// ==================================================
//
// POST /api/sales
//
// Recibe:
//
// {
//   "product_id": 5,
//   "cantidad": 2
// }
//
// Esta operación hace dos cambios relacionados:
//
// 1. Guarda la venta.
// 2. Descuenta el stock.
//
// Por eso utilizamos una transacción.
//
// Flujo:
//
// Validar datos
// ↓
// obtener conexión
// ↓
// BEGIN TRANSACTION
// ↓
// SELECT producto FOR UPDATE
// ↓
// verificar producto y stock
// ↓
// INSERT venta
// ↓
// UPDATE stock
// ↓
// COMMIT
//
router.post("/", async (req, res) => {

  // Extraemos los datos enviados
  // desde el Frontend.
  const {
    product_id,
    cantidad
  } = req.body;


  // ==================================================
  // NORMALIZAR DATOS
  // ==================================================

  // Convertimos ambos valores a Number.
  //
  // Esto permite trabajar correctamente aunque
  // eventualmente lleguen como texto numérico.
  const productId = Number(product_id);
  const quantity = Number(cantidad);


  // ==================================================
  // VALIDAR PRODUCTO
  // ==================================================

  // product_id debe ser:
  //
  // - un número entero;
  // - mayor que cero.
  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    return res.status(400).json({
      error: "El producto es inválido"
    });
  }


  // ==================================================
  // VALIDAR CANTIDAD
  // ==================================================

  // No podemos vender:
  //
  // 0 unidades
  // cantidades negativas
  // cantidades decimales
  //
  // Por eso cantidad debe ser
  // un entero mayor que cero.
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      error:
        "La cantidad debe ser un número entero mayor que 0"
    });
  }


  // Aquí almacenaremos la conexión
  // obtenida desde el pool.
  let connection;

  try {

    // ==================================================
    // OBTENER CONEXIÓN
    // ==================================================

    // En este caso utilizamos una conexión específica
    // porque varias consultas deben formar parte
    // de la MISMA transacción.
    //
    // No sería adecuado ejecutar cada operación
    // independientemente con pool.query().
    connection =
      await pool.getConnection();


    // ==================================================
    // INICIAR TRANSACCIÓN
    // ==================================================

    // Una transacción hace que varias operaciones
    // se comporten como una sola unidad.
    //
    // Queremos garantizar que:
    //
    // INSERT venta
    // +
    // UPDATE stock
    //
    // funcionen juntos.
    //
    // Si alguno falla:
    // ROLLBACK
    //
    // Si ambos funcionan:
    // COMMIT
    await connection.beginTransaction();


    // ==================================================
    // BUSCAR Y BLOQUEAR PRODUCTO
    // ==================================================

    // Buscamos el producto antes de registrar la venta.
    //
    // FOR UPDATE bloquea temporalmente esta fila
    // mientras la transacción está activa.
    //
    // Esto ayuda a evitar problemas de concurrencia.
    //
    // Ejemplo:
    //
    // Stock = 1
    //
    // Usuario A intenta vender 1
    // Usuario B intenta vender 1
    //
    // Sin bloqueo ambos podrían leer stock = 1
    // al mismo tiempo.
    //
    // Con FOR UPDATE, una transacción espera
    // mientras la otra termina.
    const products =
      await connection.query(
        `
        SELECT
          id,
          nombre,
          precio,
          stock,
          activo
        FROM products
        WHERE id = ?
        FOR UPDATE
        `,
        [productId]
      );


    // ==================================================
    // VALIDAR EXISTENCIA DEL PRODUCTO
    // ==================================================

    // No permitimos ventas cuando:
    //
    // - el producto no existe;
    // - el producto fue eliminado mediante Soft Delete.
    if (
      products.length === 0 ||
      Number(products[0].activo) !== 1
    ) {

      // Deshacemos la transacción antes
      // de abandonar la operación.
      await connection.rollback();

      return res.status(404).json({
        error:
          "Producto no encontrado"
      });
    }


    // Obtenemos el producto encontrado.
    const product = products[0];


    // ==================================================
    // VALIDAR STOCK
    // ==================================================

    // No permitimos vender más unidades
    // de las disponibles actualmente.
    //
    // Ejemplo:
    //
    // stock = 3
    // cantidad solicitada = 5
    //
    // → HTTP 400
    if (
      Number(product.stock) <
      quantity
    ) {

      await connection.rollback();

      return res.status(400).json({
        error:
          `Stock insuficiente. Disponible: ${product.stock}`
      });
    }


    // ==================================================
    // REGISTRAR VENTA
    // ==================================================

    // Guardamos:
    //
    // product_id
    // cantidad
    // precio_unitario
    //
    // El precio_unitario se copia desde products
    // en el momento exacto de la venta.
    //
    // Esto es importante para mantener
    // el historial correctamente.
    //
    // Ejemplo:
    //
    // Hoy:
    // Mouse = $20
    // venta = $20
    //
    // Mañana:
    // Mouse cambia a $30
    //
    // La venta anterior debe continuar diciendo $20.
    const result =
      await connection.query(
        `
        INSERT INTO sales
        (
          product_id,
          cantidad,
          precio_unitario
        )
        VALUES (?, ?, ?)
        `,
        [
          productId,
          quantity,
          product.precio
        ]
      );


    // ==================================================
    // DESCONTAR STOCK
    // ==================================================

    // Reducimos del inventario
    // las unidades que acabamos de vender.
    //
    // Ejemplo:
    //
    // stock = 10
    // venta = 3
    //
    // nuevo stock = 7
    await connection.query(
      `
      UPDATE products
      SET stock = stock - ?
      WHERE id = ?
      `,
      [
        quantity,
        productId
      ]
    );


    // ==================================================
    // CONFIRMAR TRANSACCIÓN
    // ==================================================

    // Hasta este punto:
    //
    // venta insertada ✓
    // stock actualizado ✓
    //
    // COMMIT confirma permanentemente
    // ambos cambios en MariaDB.
    await connection.commit();


    // ==================================================
    // RESPUESTA EXITOSA
    // ==================================================

    // HTTP 201 porque acabamos de crear
    // un nuevo recurso: una venta.
    return res.status(201).json({
      message:
        "Venta registrada correctamente",

      sale: {

        // ID generado automáticamente
        // para la nueva venta.
        id: Number(result.insertId),

        product_id:
          productId,

        producto:
          product.nombre,

        cantidad:
          quantity,

        precio_unitario:
          Number(product.precio),

        // Calculamos el stock que debe quedar
        // después de realizar la venta.
        stock_restante:
          Number(product.stock) -
          quantity
      }
    });

  } catch (error) {

    // ==================================================
    // ERROR Y ROLLBACK
    // ==================================================

    // Si ocurre cualquier excepción durante
    // la transacción, intentamos deshacer
    // los cambios realizados.
    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        // Si incluso el rollback falla,
        // dejamos evidencia en los logs.
        console.error(
          "Error haciendo rollback:",
          rollbackError
        );
      }
    }


    // Registramos el error real en los logs
    // del Backend.
    console.error(
      "Error registrando venta:",
      error
    );


    // Al cliente enviamos un mensaje
    // genérico para no exponer información interna.
    return res.status(500).json({
      error:
        "Error interno al registrar la venta"
    });

  } finally {

    // ==================================================
    // LIBERAR CONEXIÓN
    // ==================================================

    // Tanto si la venta funciona como si falla,
    // devolvemos la conexión al pool.
    if (connection) {
      connection.release();
    }
  }
});


// ==================================================
// RESUMEN DE VENTAS PARA DASHBOARD
// ==================================================
//
// GET /api/sales/summary
//
// Este endpoint no modifica información.
//
// Devuelve datos agregados que utiliza
// el Dashboard:
//
// - total de unidades vendidas;
// - productos más vendidos;
// - ventas recientes.
//
router.get(
  "/summary",
  async (req, res) => {

    let connection;

    try {

      connection =
        await pool.getConnection();


      // ==================================================
      // TOTAL DE UNIDADES VENDIDAS
      // ==================================================

      // SUM(cantidad) suma todas las unidades
      // registradas en la tabla sales.
      //
      // COALESCE(..., 0) evita devolver NULL
      // cuando todavía no existen ventas.
      //
      // Sin ventas:
      //
      // SUM(cantidad) → NULL
      //
      // Con COALESCE:
      //
      // NULL → 0
      const totals =
        await connection.query(`
          SELECT
            COALESCE(
              SUM(cantidad),
              0
            ) AS unidades_vendidas
          FROM sales
        `);


      // ==================================================
      // PRODUCTOS MÁS VENDIDOS
      // ==================================================

      // Relacionamos sales con products
      // utilizando product_id.
      //
      // Luego agrupamos las ventas de cada producto
      // y sumamos sus cantidades.
      const topProducts =
        await connection.query(`
          SELECT
            p.id,
            p.nombre,
            SUM(s.cantidad)
              AS unidades_vendidas
          FROM sales s

          INNER JOIN products p
            ON p.id = s.product_id

          GROUP BY
            p.id,
            p.nombre

          ORDER BY
            unidades_vendidas DESC,
            p.nombre ASC

          LIMIT 5
        `);


      // ==================================================
      // VENTAS RECIENTES
      // ==================================================

      // Relacionamos la venta con products
      // para mostrar también el nombre
      // del producto.
      //
      // Ordenamos primero por fecha y luego por ID
      // para obtener las ventas más recientes.
      const recentSales =
        await connection.query(`
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

          ORDER BY
            s.created_at DESC,
            s.id DESC

          LIMIT 5
        `);


      // ==================================================
      // RESPUESTA DEL DASHBOARD
      // ==================================================

      // Algunos tipos devueltos por MariaDB,
      // especialmente DECIMAL y resultados de SUM(),
      // pueden no llegar como Number de JavaScript.
      //
      // Por eso normalizamos los valores antes
      // de enviarlos al Frontend.
      return res.status(200).json({

        unidades_vendidas:
          Number(
            totals[0]
              .unidades_vendidas
          ),

        productos_mas_vendidos:
          topProducts.map(
            (product) => ({
              ...product,

              unidades_vendidas:
                Number(
                  product
                    .unidades_vendidas
                )
            })
          ),

        ventas_recientes:
          recentSales.map(
            (sale) => ({
              ...sale,

              cantidad:
                Number(
                  sale.cantidad
                ),

              precio_unitario:
                Number(
                  sale
                    .precio_unitario
                )
            })
          )
      });

    } catch (error) {

      console.error(
        "Error consultando resumen de ventas:",
        error
      );

      return res.status(500).json({
        error:
          "Error interno al consultar las ventas"
      });

    } finally {

      // Devolvemos la conexión al pool.
      if (connection) {
        connection.release();
      }
    }
  }
);


// ==================================================
// LISTAR HISTORIAL DE VENTAS
// ==================================================
//
// GET /api/sales
//
// Devuelve todas las ventas,
// comenzando por las más recientes.
//
router.get("/", async (req, res) => {

  let connection;

  try {

    connection =
      await pool.getConnection();


    // ==================================================
    // CONSULTAR VENTAS
    // ==================================================

    // INNER JOIN permite relacionar:
//
// sales.product_id
//        ↓
// products.id
//
// De esta manera podemos devolver
// información de ambas tablas:
//
// sales
// ├── cantidad
// ├── precio
// └── fecha
//
// products
// └── nombre
    const sales =
      await connection.query(`
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

        ORDER BY
          s.created_at DESC,
          s.id DESC
      `);


    // ==================================================
    // NORMALIZAR Y RESPONDER
    // ==================================================

    // Convertimos explícitamente algunos campos
    // a Number antes de enviarlos como JSON.
    return res.status(200).json(

      sales.map(
        (sale) => ({
          ...sale,

          cantidad:
            Number(
              sale.cantidad
            ),

          precio_unitario:
            Number(
              sale
                .precio_unitario
            )
        })
      )
    );

  } catch (error) {

    console.error(
      "Error consultando ventas:",
      error
    );

    return res.status(500).json({
      error:
        "Error interno al consultar las ventas"
    });

  } finally {

    // Siempre devolvemos la conexión al pool.
    if (connection) {
      connection.release();
    }
  }
});


// ==================================================
// EXPORTAR ROUTER
// ==================================================

// Exportamos el router para utilizarlo
// desde server.js.
//
// Allí tenemos:
//
// app.use(
//   "/api/sales",
//   authenticateToken,
//   salesRouter
// );
//
// Por eso todos estos endpoints requieren
// una sesión con JWT válido.
module.exports = router;