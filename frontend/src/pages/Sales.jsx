// ==================================================
// HOOKS DE REACT
// ==================================================
//
// useState:
// guarda información que puede cambiar.
//
// useEffect:
// ejecuta código cuando el componente se carga.
//
// useMemo:
// memoriza un cálculo y solamente lo vuelve
// a ejecutar cuando cambian sus dependencias.
import {
  useEffect,
  useMemo,
  useState
} from "react";


// ==================================================
// ICONOS
// ==================================================
//
// Los iconos provienen de lucide-react
// y se utilizan únicamente para mejorar
// la interfaz visual.
import {
  ShoppingCart,
  Package,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";


// ==================================================
// COMPONENTE SALES
// ==================================================
//
// Esta página permite:
//
// - consultar productos disponibles;
// - seleccionar un producto;
// - indicar una cantidad;
// - registrar una venta;
// - actualizar el stock;
// - consultar el historial de ventas.
//
// Se comunica principalmente con:
//
// GET  /api/products
// GET  /api/sales
// POST /api/sales
//
function Sales() {


  // ==================================================
  // PRODUCTOS
  // ==================================================

  // Guarda los productos activos recibidos
  // desde GET /api/products.
  const [
    products,
    setProducts
  ] = useState([]);


  // ==================================================
  // HISTORIAL DE VENTAS
  // ==================================================

  // Guarda las ventas recibidas
  // desde GET /api/sales.
  const [
    sales,
    setSales
  ] = useState([]);


  // ==================================================
  // PRODUCTO SELECCIONADO
  // ==================================================

  // Guarda el ID del producto seleccionado
  // en el <select>.
  //
  // Inicialmente está vacío porque todavía
  // no existe ningún producto seleccionado.
  const [
    productId,
    setProductId
  ] = useState("");


  // ==================================================
  // CANTIDAD
  // ==================================================

  // Guarda la cantidad de unidades
  // que se desean vender.
  //
  // Por defecto inicia en 1.
  const [
    quantity,
    setQuantity
  ] = useState(1);


  // ==================================================
  // ESTADO DE CARGA INICIAL
  // ==================================================

  // loading indica si todavía estamos cargando:
  //
  // - productos;
  // - historial de ventas.
  const [
    loading,
    setLoading
  ] = useState(true);


  // ==================================================
  // ESTADO DE REGISTRO DE VENTA
  // ==================================================

  // saving indica si actualmente existe
  // una venta en proceso.
  //
  // Esto evita que el usuario pueda enviar
  // la misma venta varias veces rápidamente.
  const [
    saving,
    setSaving
  ] = useState(false);


  // ==================================================
  // MENSAJES
  // ==================================================

  // Mensaje de error.
  const [
    error,
    setError
  ] = useState("");


  // Mensaje de operación exitosa.
  const [
    success,
    setSuccess
  ] = useState("");


  // ==================================================
  // CARGAR PRODUCTOS Y VENTAS
  // ==================================================
  //
  // Esta función consulta:
  //
  // GET /api/products
  // GET /api/sales
  //
  // Utilizamos Promise.all() para realizar
  // ambas peticiones al mismo tiempo.
  //
  const loadData = async () => {

    try {

      // Limpiamos cualquier error anterior.
      setError("");


      // ==================================================
      // PETICIONES EN PARALELO
      // ==================================================
      //
      // productos ─────┐
      //                ├── simultáneamente
      // ventas ────────┘
      //
      const [
        productsResponse,
        salesResponse
      ] = await Promise.all([


        // ----------------------------------------------
        // PRODUCTOS
        // ----------------------------------------------

        fetch(
          "/api/products",
          {
            // Incluye la cookie JWT
            // en la solicitud.
            credentials: "include"
          }
        ),


        // ----------------------------------------------
        // VENTAS
        // ----------------------------------------------

        fetch(
          "/api/sales",
          {
            // Incluye la cookie JWT.
            credentials: "include"
          }
        )

      ]);


      // ==================================================
      // CONVERTIR RESPUESTAS JSON
      // ==================================================

      const productsData =
        await productsResponse.json();


      const salesData =
        await salesResponse.json();


      // ==================================================
      // VALIDAR RESPUESTA DE PRODUCTOS
      // ==================================================

      if (!productsResponse.ok) {

        throw new Error(
          productsData.error ||
          "No se pudieron cargar los productos"
        );
      }


      // ==================================================
      // VALIDAR RESPUESTA DE VENTAS
      // ==================================================

      if (!salesResponse.ok) {

        throw new Error(
          salesData.error ||
          "No se pudieron cargar las ventas"
        );
      }


      // ==================================================
      // GUARDAR INFORMACIÓN
      // ==================================================

      // Guardamos los productos disponibles.
      setProducts(productsData);

      // Guardamos el historial de ventas.
      setSales(salesData);

    } catch (error) {

      // Mostramos cualquier error recibido
      // desde la API.
      setError(error.message);

    } finally {

      // Finaliza la carga inicial.
      setLoading(false);
    }
  };


  // ==================================================
  // CARGA INICIAL DEL COMPONENTE
  // ==================================================

  // Cuando Sales se monta por primera vez,
  // ejecutamos loadData().
  useEffect(() => {

    loadData();

    // [] significa que se ejecuta
    // al montar inicialmente el componente.
  }, []);


  // ==================================================
  // PRODUCTO SELECCIONADO
  // ==================================================
  //
  // productId solamente contiene el ID.
  //
  // Para mostrar información como:
  //
  // - nombre;
  // - stock;
  // - precio;
  //
  // necesitamos encontrar el objeto completo
  // dentro del array products.
  //
  const selectedProduct =
    useMemo(() => {

      return products.find(
        (product) =>
          Number(product.id) ===
          Number(productId)
      );

    }, [
      products,
      productId
    ]);


  // ==================================================
  // REGISTRAR VENTA
  // ==================================================
  //
  // Flujo:
  //
  // Formulario
  // ↓
  // validar producto
  // ↓
  // validar cantidad
  // ↓
  // validar stock
  // ↓
  // POST /api/sales
  // ↓
  // Backend registra venta
  // ↓
  // Backend descuenta stock
  // ↓
  // respuesta 201
  // ↓
  // recargar productos y ventas
  //
  const handleSale = async (event) => {

    // Evita que el formulario recargue
    // completamente la página.
    event.preventDefault();


    // Limpiamos mensajes anteriores.
    setError("");

    setSuccess("");


    // ==================================================
    // NORMALIZAR DATOS
    // ==================================================

    // Los valores provenientes de inputs/select
    // normalmente llegan como texto.
    //
    // Por eso los convertimos a Number.
    const parsedProductId =
      Number(productId);


    const parsedQuantity =
      Number(quantity);


    // ==================================================
    // VALIDAR PRODUCTO
    // ==================================================

    // product_id debe ser:
    //
    // - entero;
    // - mayor que cero.
    if (
      !Number.isInteger(
        parsedProductId
      ) ||
      parsedProductId <= 0
    ) {

      setError(
        "Seleccione un producto válido."
      );

      return;
    }


    // ==================================================
    // VALIDAR CANTIDAD
    // ==================================================

    // La cantidad debe ser:
    //
    // - un número entero;
    // - mayor que cero.
    if (
      !Number.isInteger(
        parsedQuantity
      ) ||
      parsedQuantity <= 0
    ) {

      setError(
        "La cantidad debe ser mayor que 0."
      );

      return;
    }


    // ==================================================
    // VALIDAR STOCK EN EL FRONTEND
    // ==================================================

    // Si el producto existe y la cantidad solicitada
    // supera el stock disponible,
    // mostramos el error antes de llamar a la API.
    //
    // Esto mejora la experiencia del usuario.
    //
    // IMPORTANTE:
    // el Backend también realiza esta validación.
    //
    // La validación del Backend es la
    // que realmente protege los datos.
    if (
      selectedProduct &&
      parsedQuantity >
        Number(selectedProduct.stock)
    ) {

      setError(
        `Stock insuficiente. Disponible: ${selectedProduct.stock}`
      );

      return;
    }


    try {

      // ==================================================
      // INICIAR REGISTRO
      // ==================================================

      setSaving(true);


      // ==================================================
      // ENVIAR VENTA AL BACKEND
      // ==================================================

      const response =
        await fetch(
          "/api/sales",
          {
            // Estamos creando una venta.
            method: "POST",


            // Incluimos la cookie JWT.
            credentials: "include",


            // Indicamos que enviaremos JSON.
            headers: {
              "Content-Type":
                "application/json"
            },


            // Convertimos los datos
            // de JavaScript a JSON.
            body: JSON.stringify({

              product_id:
                parsedProductId,

              cantidad:
                parsedQuantity
            })
          }
        );


      // ==================================================
      // LEER RESPUESTA
      // ==================================================

      const data =
        await response.json();


      // ==================================================
      // VALIDAR RESPUESTA
      // ==================================================

      if (!response.ok) {

        throw new Error(
          data.error ||
          "No se pudo registrar la venta"
        );
      }


      // ==================================================
      // VENTA EXITOSA
      // ==================================================

      // Mostramos el mensaje enviado
      // por el Backend.
      setSuccess(
        data.message ||
        "Venta registrada correctamente"
      );


      // ==================================================
      // REINICIAR FORMULARIO
      // ==================================================

      // Quitamos el producto seleccionado.
      setProductId("");

      // Reiniciamos cantidad a 1.
      setQuantity(1);


      // ==================================================
      // ACTUALIZAR INFORMACIÓN
      // ==================================================
      //
      // Después de registrar una venta:
      //
      // - existe una nueva fila en sales;
      // - el producto tiene menos stock.
      //
      // Por eso volvemos a consultar la API.
      //
      // Así la interfaz queda sincronizada
      // con la base de datos.
      await loadData();

    } catch (error) {

      // Mostramos cualquier error recibido
      // desde el Backend.
      setError(error.message);

    } finally {

      // Finaliza el proceso de registro.
      setSaving(false);
    }
  };


  // ==================================================
  // FORMATO DE FECHA
  // ==================================================
  //
  // Convierte la fecha recibida desde MariaDB
  // a un formato más fácil de leer.
  //
  // Ejemplo:
  //
  // 2026-10-10T14:30:00
  //
  // ↓
  //
  // 10/10/2026, 02:30 p. m.
  //
  const formatDate = (date) => {

    // Si no existe fecha,
    // devolvemos texto vacío.
    if (!date) {
      return "";
    }


    return new Date(date)
      .toLocaleString(
        "es-CR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );
  };


  // ==================================================
  // PANTALLA DE CARGA
  // ==================================================

  // Mientras obtenemos productos y ventas,
  // mostramos un mensaje temporal.
  if (loading) {

    return (

      <div className="page-header">

        <div>

          <h1>
            Ventas
          </h1>

          <p>
            Cargando información...
          </p>

        </div>

      </div>
    );
  }


  // ==================================================
  // INTERFAZ DE VENTAS
  // ==================================================

  return (

    <div className="sales-page">


      {/* ==================================================
          ENCABEZADO
          ================================================== */}

      <div className="products-header">

        <div>

          <span className="page-eyebrow">
            Gestión comercial
          </span>


          <h1>
            Ventas
          </h1>


          <p>
            Registra ventas y consulta los
            movimientos realizados
          </p>

        </div>

      </div>


      {/* ==================================================
          MENSAJE DE ÉXITO
          ================================================== */}

      {success && (

        <div className="feedback-message success-message">

          <CheckCircle size={18} />

          {success}

        </div>

      )}


      {/* ==================================================
          MENSAJE DE ERROR
          ================================================== */}

      {error && (

        <div className="feedback-message error-message">

          <AlertCircle size={18} />

          {error}

        </div>

      )}


      {/* ==================================================
          ÁREA PRINCIPAL DE REGISTRO
          ================================================== */}

      <div className="sales-layout">


        {/* ==================================================
            FORMULARIO DE VENTA
            ================================================== */}

        <section className="sale-form-card">


          {/* ----------------------------------------------
              ENCABEZADO DEL FORMULARIO
              ---------------------------------------------- */}

          <div className="sale-card-header">


            <div className="sale-header-icon">

              <ShoppingCart size={21} />

            </div>


            <div>

              <h2>
                Registrar venta
              </h2>


              <p>
                Selecciona un producto y la
                cantidad vendida
              </p>

            </div>

          </div>


          {/* ==================================================
              FORMULARIO
              ================================================== */}

          <form
            className="sale-form"
            onSubmit={handleSale}
          >


            {/* ================================================
                SELECCIONAR PRODUCTO
                ================================================ */}

            <div className="form-field">

              <label>
                Producto
              </label>


              <select
                className="sales-select"

                // ID seleccionado.
                value={productId}

                // Actualizamos el estado
                // cuando cambia el producto.
                onChange={(event) =>
                  setProductId(
                    event.target.value
                  )
                }
              >


                {/* Opción inicial */}
                <option value="">
                  Seleccione un producto
                </option>


                {/* Creamos una opción
                    por cada producto activo. */}
                {products.map(
                  (product) => (

                    <option
                      key={product.id}

                      value={product.id}

                      // Si no existe stock,
                      // no permitimos seleccionarlo.
                      disabled={
                        Number(
                          product.stock
                        ) === 0
                      }
                    >

                      {product.nombre}

                      {" — "}

                      Stock: {product.stock}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* ==================================================
                PRODUCTO SELECCIONADO
                ================================================== */}

            {/* Esta tarjeta solamente aparece
                cuando selectedProduct existe. */}
            {selectedProduct && (

              <div className="selected-product-card">


                <div className="selected-product-icon">

                  <Package size={20} />

                </div>


                {/* Nombre */}
                <div>

                  <span>
                    Producto seleccionado
                  </span>

                  <strong>
                    {selectedProduct.nombre}
                  </strong>

                </div>


                {/* Stock */}
                <div className="selected-product-stock">

                  <span>
                    Stock disponible
                  </span>

                  <strong>
                    {selectedProduct.stock}
                  </strong>

                </div>

              </div>

            )}


            {/* ==================================================
                CANTIDAD
                ================================================== */}

            <div className="form-field">

              <label>
                Cantidad
              </label>


              <input
                type="number"

                // Mínimo permitido.
                min="1"

                // Si existe producto seleccionado,
                // el máximo será su stock actual.
                max={
                  selectedProduct
                    ? selectedProduct.stock
                    : undefined
                }

                value={quantity}

                onChange={(event) =>
                  setQuantity(
                    event.target.value
                  )
                }
              />

            </div>


            {/* ==================================================
                BOTÓN REGISTRAR
                ================================================== */}

            <button
              type="submit"

              className="primary-button sale-submit-button"

              // El botón se deshabilita cuando:
              //
              // - ya estamos registrando;
              // - no hay producto seleccionado;
              // - el producto no existe;
              // - el producto no tiene stock.
              disabled={
                saving ||
                !productId ||
                !selectedProduct ||
                Number(
                  selectedProduct.stock
                ) === 0
              }
            >

              <Plus size={18} />


              {saving
                ? "Registrando..."
                : "Registrar venta"}

            </button>

          </form>

        </section>


        {/* ==================================================
            INFORMACIÓN DEL PROCESO
            ================================================== */}

        <section className="sale-info-card">


          <div className="sale-info-icon">

            <ShoppingCart size={25} />

          </div>


          <h3>
            ¿Qué ocurre al vender?
          </h3>


          <p>
            Cuando registras una venta, el sistema
            guarda el movimiento y actualiza
            automáticamente el stock del producto.
          </p>


          {/* Flujo visual de una venta */}
          <div className="sale-flow">

            <span>
              Registrar venta
            </span>

            <span>
              ↓
            </span>

            <span>
              Guardar movimiento
            </span>

            <span>
              ↓
            </span>

            <span>
              Actualizar stock
            </span>

            <span>
              ↓
            </span>

            <span>
              Actualizar Dashboard
            </span>

          </div>

        </section>

      </div>


      {/* ==================================================
          HISTORIAL DE VENTAS
          ================================================== */}

      <section className="sales-history-card">


        {/* ==================================================
            ENCABEZADO DEL HISTORIAL
            ================================================== */}

        <div className="sales-history-header">


          <div>


            <div className="dashboard-panel-title">

              <Clock size={19} />


              <h2>
                Historial de ventas
              </h2>

            </div>


            <p>
              Movimientos registrados en el sistema
            </p>

          </div>


          {/* Cantidad total de registros
              cargados en el historial. */}
          <span className="sales-count">

            {sales.length}{" "}

            {sales.length === 1
              ? "venta"
              : "ventas"}

          </span>

        </div>


        {/* ==================================================
            SIN VENTAS
            ================================================== */}

        {sales.length === 0 ? (

          <div className="dashboard-empty">

            <ShoppingCart size={30} />


            <strong>
              No hay ventas registradas
            </strong>


            <span>
              La primera venta aparecerá
              aquí automáticamente.
            </span>

          </div>


        ) : (


          /* ==================================================
             TABLA DE VENTAS
             ================================================== */

          <div className="table-responsive">


            <table className="products-table">


              {/* ============================================
                  ENCABEZADO
                  ============================================ */}

              <thead>

                <tr>

                  <th>
                    Producto
                  </th>

                  <th>
                    Cantidad
                  </th>

                  <th>
                    Precio unitario (USD)
                  </th>

                  <th>
                    Fecha
                  </th>

                </tr>

              </thead>


              {/* ============================================
                  CUERPO DE LA TABLA
                  ============================================ */}

              <tbody>


                {/* Creamos una fila
                    por cada venta registrada. */}
                {sales.map(
                  (sale) => (

                    <tr key={sale.id}>


                      {/* ==================================
                          PRODUCTO
                          ================================== */}

                      <td>

                        <div className="product-info">


                          <div className="product-avatar">

                            <ShoppingCart size={17} />

                          </div>


                          <div>

                            <strong>
                              {sale.producto}
                            </strong>


                            <span>
                              Venta #{sale.id}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* ==================================
                          CANTIDAD
                          ================================== */}

                      <td>

                        <span className="sale-quantity-badge">

                          {sale.cantidad}{" "}


                          {/* Singular / plural */}
                          {sale.cantidad === 1
                            ? "unidad"
                            : "unidades"}

                        </span>

                      </td>


                      {/* ==================================
                          PRECIO HISTÓRICO
                          ================================== */}

                      <td className="price-cell">

                        $

                        {Number(
                          sale.precio_unitario
                        ).toFixed(2)}

                      </td>


                      {/* ==================================
                          FECHA
                          ================================== */}

                      <td>

                        {formatDate(
                          sale.created_at
                        )}

                      </td>

                    </tr>

                  )
                )}


              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Sales;