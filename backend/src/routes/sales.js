// ==================================================
// DEPENDENCIAS
// ==================================================

const express = require("express");

// Pool de conexiones hacia MariaDB.
const pool = require("../db");


// ==================================================
// ROUTER
// ==================================================

const router = express.Router();


// ==================================================
// REGISTRAR UNA VENTA
// ==================================================
//
// POST /api/sales
//
// Flujo:
//
// recibir producto + cantidad
// ↓
// validar datos
// ↓
// iniciar transacción
// ↓
// bloquear producto
// ↓
// comprobar stock
// ↓
// guardar venta
// ↓
// descontar stock
// ↓
// COMMIT
//
// La transacción garantiza que:
// INSERT venta + UPDATE stock
// funcionen como una sola operación.
//
router.post("/", async (req, res) => {

  // Obtenemos los valores enviados
  // por el Frontend.
  const {
    product_id,
    cantidad
  } = req.body;


  // Convertimos los valores a Number.
  const productId =
    Number(product_id);

  const quantity =
    Number(cantidad);


  // ==================================================
  // VALIDAR PRODUCTO
  // ==================================================

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {

    return res.status(400).json({
      error: "Producto inválido"
    });
  }


  // ==================================================
  // VALIDAR CANTIDAD
  // ==================================================

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {

    return res.status(400).json({
      error:
        "La cantidad debe ser un número entero mayor que 0"
    });
  }


  // Variable donde guardaremos
  // la conexión dedicada.
  let connection;


  try {

    // ==================================================
    // OBTENER CONEXIÓN
    // ==================================================

    connection =
      await pool.getConnection();


    // ==================================================
    // INICIAR TRANSACCIÓN
    // ==================================================

    await connection.beginTransaction();


    // ==================================================
    // CONSULTAR Y BLOQUEAR PRODUCTO
    // ==================================================
    //
    // FOR UPDATE bloquea temporalmente
    // esta fila mientras dura la transacción.
    //
    // Esto evita problemas como:
    //
    // stock = 1
    //
    // Usuario A quiere comprar 1
    // Usuario B quiere comprar 1
    //
    // Sin bloqueo ambos podrían leer stock = 1.
    //
    // Con FOR UPDATE uno debe esperar
    // a que termine el otro.
    //
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


    const product =
      products[0];


    // ==================================================
    // PRODUCTO NO DISPONIBLE
    // ==================================================

    // Si no existe o fue enviado
    // a la papelera, no permitimos venderlo.
    if (
      !product ||
      Number(product.activo) !== 1
    ) {

      await connection.rollback();

      return res.status(404).json({
        error:
          "Producto no encontrado o no disponible"
      });
    }


    // ==================================================
    // VALIDAR STOCK
    // ==================================================

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
    // GUARDAR VENTA
    // ==================================================
    //
    // Guardamos precio_unitario porque queremos
    // conservar el precio histórico.
    //
    // No necesitamos indicar estado porque
    // MariaDB utiliza automáticamente:
    //
    // estado = 'completada'
    //
    // gracias al DEFAULT definido en init.sql.
    //
    const result =
      await connection.query(
        `
        INSERT INTO sales (
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
    //
    // Solamente después de que:
    //
    // - se guardó la venta;
    // - se actualizó el stock;
    //
    // confirmamos los cambios.
    //
    await connection.commit();


    // ==================================================
    // RESPUESTA EXITOSA
    // ==================================================

    return res.status(201).json({

      message:
        "Venta registrada correctamente",

      sale: {

        id:
          Number(result.insertId),

        product_id:
          productId,

        producto:
          product.nombre,

        cantidad:
          quantity,

        precio_unitario:
          Number(product.precio),

        stock_restante:
          Number(product.stock) -
          quantity,

        estado:
          "completada"
      }
    });


  } catch (error) {

    // ==================================================
    // ERROR EN LA TRANSACCIÓN
    // ==================================================

    // Si algo falla después de iniciar
    // la transacción, intentamos revertirla.
    if (connection) {

      try {

        await connection.rollback();

      } catch (rollbackError) {

        console.error(
          "Error haciendo rollback:",
          rollbackError
        );
      }
    }


    console.error(
      "Error registrando venta:",
      error
    );


    return res.status(500).json({
      error:
        "Error interno al registrar la venta"
    });


  } finally {

    // ==================================================
    // LIBERAR CONEXIÓN
    // ==================================================

    // La conexión vuelve al pool
    // para poder ser reutilizada.
    if (connection) {
      connection.release();
    }
  }
});


// ==================================================
// ANULAR UNA VENTA
// ==================================================
//
// PATCH /api/sales/:id/cancel
//
// Ejemplo:
//
// PATCH /api/sales/4/cancel
//
// No eliminamos físicamente la venta.
//
// En su lugar:
//
// estado = 'anulada'
// anulada_at = CURRENT_TIMESTAMP
//
// Además debemos devolver al inventario
// las unidades que originalmente se descontaron.
//
// Ejemplo:
//
// Venta original:
// 4 iPhones
//
// stock:
// 10 → 6
//
// Anular:
//
// stock:
// 6 → 10
//
// Todo ocurre dentro de una transacción.
//
router.patch(
  "/:id/cancel",
  async (req, res) => {

    // ==================================================
    // VALIDAR ID
    // ==================================================

    const saleId =
      Number(req.params.id);


    if (
      !Number.isInteger(saleId) ||
      saleId <= 0
    ) {

      return res.status(400).json({
        error: "ID de venta inválido"
      });
    }


    let connection;


    try {

      // ==================================================
      // OBTENER CONEXIÓN
      // ==================================================

      connection =
        await pool.getConnection();


      // ==================================================
      // INICIAR TRANSACCIÓN
      // ==================================================

      await connection.beginTransaction();


      // ==================================================
      // BUSCAR Y BLOQUEAR VENTA
      // ==================================================
      //
      // FOR UPDATE evita que dos solicitudes
      // intenten anular la misma venta
      // exactamente al mismo tiempo.
      //
      const sales =
        await connection.query(
          `
          SELECT
            id,
            product_id,
            cantidad,
            estado
          FROM sales
          WHERE id = ?
          FOR UPDATE
          `,
          [saleId]
        );


      const sale =
        sales[0];


      // ==================================================
      // VENTA NO EXISTE
      // ==================================================

      if (!sale) {

        await connection.rollback();

        return res.status(404).json({
          error: "Venta no encontrada"
        });
      }


      // ==================================================
      // EVITAR DOBLE ANULACIÓN
      // ==================================================
      //
      // Esto es fundamental.
      //
      // Si permitiéramos anular dos veces:
      //
      // Venta:
      // 4 unidades
      //
      // primera anulación:
      // stock +4
      //
      // segunda anulación:
      // stock +4 otra vez
      //
      // Eso produciría inventario incorrecto.
      //
      if (sale.estado !== "completada") {

        await connection.rollback();

        return res.status(409).json({
          error:
            "Esta venta ya fue anulada"
        });
      }


      // ==================================================
      // BLOQUEAR PRODUCTO
      // ==================================================
      //
      // También bloqueamos el producto antes
      // de modificar su stock.
      //
      const products =
        await connection.query(
          `
          SELECT
            id,
            stock
          FROM products
          WHERE id = ?
          FOR UPDATE
          `,
          [sale.product_id]
        );


      const product =
        products[0];


      // La clave foránea debería garantizar
      // que el producto exista.
      //
      // Aun así comprobamos por seguridad.
      if (!product) {

        await connection.rollback();

        return res.status(500).json({
          error:
            "No se encontró el producto asociado a la venta"
        });
      }


      // ==================================================
      // DEVOLVER STOCK
      // ==================================================
      //
      // La cantidad que había sido descontada
      // vuelve al inventario.
      //
      // Ejemplo:
      //
      // stock actual = 6
      // venta = 4
      //
      // 6 + 4 = 10
      //
      await connection.query(
        `
        UPDATE products
        SET stock = stock + ?
        WHERE id = ?
        `,
        [
          Number(sale.cantidad),
          sale.product_id
        ]
      );


      // ==================================================
      // MARCAR VENTA COMO ANULADA
      // ==================================================

      const updateResult =
        await connection.query(
          `
          UPDATE sales
          SET
            estado = 'anulada',
            anulada_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND estado = 'completada'
          `,
          [saleId]
        );


      // Esta comprobación agrega una capa adicional
      // de seguridad.
      if (
        updateResult.affectedRows === 0
      ) {

        await connection.rollback();

        return res.status(409).json({
          error:
            "La venta no pudo ser anulada"
        });
      }


      // ==================================================
      // CONFIRMAR TODO
      // ==================================================
      //
      // Solamente ahora quedan permanentes:
      //
      // stock restaurado
      // +
      // venta anulada
      //
      await connection.commit();


      // Calculamos el nuevo stock
      // para incluirlo en la respuesta.
      const newStock =
        Number(product.stock) +
        Number(sale.cantidad);


      // ==================================================
      // RESPUESTA
      // ==================================================

      return res.status(200).json({

        message:
          "Venta anulada correctamente",

        sale: {
          id:
            saleId,

          estado:
            "anulada",

          unidades_reintegradas:
            Number(sale.cantidad),

          stock_actual:
            newStock
        }
      });


    } catch (error) {

      // ==================================================
      // ERROR
      // ==================================================

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "Error haciendo rollback:",
            rollbackError
          );
        }
      }


      console.error(
        "Error anulando venta:",
        error
      );


      return res.status(500).json({
        error:
          "Error interno al anular la venta"
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
// RESUMEN DE VENTAS
// ==================================================
//
// GET /api/sales/summary
//
// Este endpoint alimenta Dashboard.
//
// IMPORTANTE:
//
// Las ventas anuladas NO deben formar parte
// de los indicadores.
//
// Por eso utilizamos:
//
// WHERE estado = 'completada'
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
      //
      // SUM(cantidad) suma todas las unidades
      // de ventas válidas.
      //
      // COALESCE convierte NULL en 0
      // cuando todavía no existen ventas.
      //
      const totals =
        await connection.query(
          `
          SELECT
            COALESCE(
              SUM(cantidad),
              0
            ) AS unidades_vendidas
          FROM sales
          WHERE estado = 'completada'
          `
        );


      // ==================================================
      // PRODUCTOS MÁS VENDIDOS
      // ==================================================
      //
      // Agrupamos las ventas válidas
      // por producto.
      //
      const topProducts =
        await connection.query(
          `
          SELECT
            p.id,
            p.nombre,
            SUM(s.cantidad)
              AS unidades_vendidas
          FROM sales s
          INNER JOIN products p
            ON p.id = s.product_id
          WHERE s.estado = 'completada'
          GROUP BY
            p.id,
            p.nombre
          ORDER BY
            unidades_vendidas DESC,
            p.nombre ASC
          LIMIT 5
          `
        );


      // ==================================================
      // VENTAS RECIENTES
      // ==================================================
      //
      // El Dashboard solamente muestra
      // movimientos válidos.
      //
      // Una venta anulada seguirá apareciendo
      // en el historial general de Sales,
      // pero no aquí.
      //
      const recentSales =
        await connection.query(
          `
          SELECT
            s.id,
            p.nombre AS producto,
            s.cantidad,
            s.precio_unitario,
            s.created_at
          FROM sales s
          INNER JOIN products p
            ON p.id = s.product_id
          WHERE s.estado = 'completada'
          ORDER BY
            s.created_at DESC,
            s.id DESC
          LIMIT 5
          `
        );


      // ==================================================
      // RESPUESTA
      // ==================================================

      return res.status(200).json({

        unidades_vendidas:
          Number(
            totals[0]
              ?.unidades_vendidas || 0
          ),


        productos_mas_vendidos:
          topProducts.map(
            (product) => ({

              id:
                product.id,

              nombre:
                product.nombre,

              unidades_vendidas:
                Number(
                  product.unidades_vendidas
                )
            })
          ),


        ventas_recientes:
          recentSales.map(
            (sale) => ({

              id:
                sale.id,

              producto:
                sale.producto,

              cantidad:
                Number(
                  sale.cantidad
                ),

              precio_unitario:
                Number(
                  sale.precio_unitario
                ),

              created_at:
                sale.created_at
            })
          )

      });


    } catch (error) {

      console.error(
        "Error obteniendo resumen de ventas:",
        error
      );


      return res.status(500).json({
        error:
          "Error interno al obtener el resumen de ventas"
      });


    } finally {

      if (connection) {
        connection.release();
      }
    }
  }
);


// ==================================================
// HISTORIAL COMPLETO DE VENTAS
// ==================================================
//
// GET /api/sales
//
// A diferencia del Dashboard,
// aquí SÍ devolvemos:
//
// - ventas completadas;
// - ventas anuladas.
//
// Esto permite conservar trazabilidad.
//
// El Frontend utilizará "estado"
// para decidir:
//
// completada
// → mostrar botón Anular
//
// anulada
// → mostrar etiqueta Anulada
//
router.get(
  "/",
  async (req, res) => {

    let connection;


    try {

      connection =
        await pool.getConnection();


      // ==================================================
      // CONSULTAR HISTORIAL
      // ==================================================

      const sales =
        await connection.query(
          `
          SELECT
            s.id,
            s.product_id,
            p.nombre AS producto,
            s.cantidad,
            s.precio_unitario,
            s.estado,
            s.created_at,
            s.anulada_at
          FROM sales s
          INNER JOIN products p
            ON p.id = s.product_id
          ORDER BY
            s.created_at DESC,
            s.id DESC
          `
        );


      // ==================================================
      // NORMALIZAR RESPUESTA
      // ==================================================
      //
      // Algunos valores provenientes de MariaDB,
      // especialmente DECIMAL,
      // pueden recibirse como strings.
      //
      // Los convertimos explícitamente a Number.
      //
      const normalizedSales =
        sales.map(
          (sale) => ({

            id:
              sale.id,

            product_id:
              sale.product_id,

            producto:
              sale.producto,

            cantidad:
              Number(
                sale.cantidad
              ),

            precio_unitario:
              Number(
                sale.precio_unitario
              ),

            estado:
              sale.estado,

            created_at:
              sale.created_at,

            anulada_at:
              sale.anulada_at
          })
        );


      return res.status(200).json(
        normalizedSales
      );


    } catch (error) {

      console.error(
        "Error obteniendo ventas:",
        error
      );


      return res.status(500).json({
        error:
          "Error interno al obtener las ventas"
      });


    } finally {

      if (connection) {
        connection.release();
      }
    }
  }
);


// ==================================================
// EXPORTAR ROUTER
// ==================================================

module.exports = router;