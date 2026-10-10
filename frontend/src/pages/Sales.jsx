// ==================================================
// HOOKS DE REACT
// ==================================================

import {
  useEffect,
  useMemo,
  useState
} from "react";


// ==================================================
// ICONOS
// ==================================================

import {
  ShoppingCart,
  Package,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Ban
} from "lucide-react";


// ==================================================
// COMPONENTE SALES
// ==================================================
//
// Esta página permite:
//
// - consultar productos disponibles;
// - registrar ventas;
// - consultar el historial;
// - visualizar el estado de cada venta;
// - anular ventas registradas incorrectamente.
//
// Endpoints utilizados:
//
// GET   /api/products
// GET   /api/sales
// POST  /api/sales
// PATCH /api/sales/:id/cancel
//
function Sales() {


  // ==================================================
  // PRODUCTOS
  // ==================================================

  const [
    products,
    setProducts
  ] = useState([]);


  // ==================================================
  // VENTAS
  // ==================================================

  const [
    sales,
    setSales
  ] = useState([]);


  // ==================================================
  // FORMULARIO DE VENTA
  // ==================================================

  const [
    productId,
    setProductId
  ] = useState("");


  const [
    quantity,
    setQuantity
  ] = useState(1);


  // ==================================================
  // CARGA INICIAL
  // ==================================================

  const [
    loading,
    setLoading
  ] = useState(true);


  // ==================================================
  // REGISTRANDO VENTA
  // ==================================================

  const [
    saving,
    setSaving
  ] = useState(false);


  // ==================================================
  // ANULANDO VENTA
  // ==================================================
  //
  // cancelling indica si actualmente
  // existe una solicitud de anulación
  // en proceso.
  //
  const [
    cancelling,
    setCancelling
  ] = useState(false);


  // ==================================================
  // VENTA SELECCIONADA PARA ANULAR
  // ==================================================
  //
  // Guarda temporalmente la venta sobre
  // la cual el usuario hizo clic en "Anular".
  //
  const [
    saleToCancel,
    setSaleToCancel
  ] = useState(null);


  // ==================================================
  // MODAL DE ANULACIÓN
  // ==================================================

  const [
    cancelModalOpen,
    setCancelModalOpen
  ] = useState(false);


  // ==================================================
  // MENSAJES
  // ==================================================

  const [
    error,
    setError
  ] = useState("");


  const [
    success,
    setSuccess
  ] = useState("");


  // ==================================================
  // CARGAR PRODUCTOS Y VENTAS
  // ==================================================
  //
  // Realizamos ambas peticiones simultáneamente.
  //
  const loadData = async () => {

    try {

      setError("");


      const [
        productsResponse,
        salesResponse
      ] = await Promise.all([


        // ----------------------------------------------
        // PRODUCTOS ACTIVOS
        // ----------------------------------------------

        fetch(
          "/api/products",
          {
            credentials: "include"
          }
        ),


        // ----------------------------------------------
        // HISTORIAL DE VENTAS
        // ----------------------------------------------

        fetch(
          "/api/sales",
          {
            credentials: "include"
          }
        )

      ]);


      // ==================================================
      // CONVERTIR RESPUESTAS
      // ==================================================

      const productsData =
        await productsResponse.json();


      const salesData =
        await salesResponse.json();


      // ==================================================
      // VALIDAR PRODUCTOS
      // ==================================================

      if (!productsResponse.ok) {

        throw new Error(
          productsData.error ||
          "No se pudieron cargar los productos"
        );
      }


      // ==================================================
      // VALIDAR VENTAS
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

      setProducts(productsData);

      setSales(salesData);


    } catch (error) {

      setError(error.message);


    } finally {

      setLoading(false);
    }
  };


  // ==================================================
  // CARGA INICIAL
  // ==================================================

  useEffect(() => {

    loadData();

  }, []);


  // ==================================================
  // PRODUCTO SELECCIONADO
  // ==================================================
  //
  // productId solamente contiene un ID.
  //
  // Buscamos dentro del array products
  // el objeto completo correspondiente.
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

  const handleSale = async (event) => {

    event.preventDefault();


    // Evitamos enviar otra venta
    // mientras existe una en proceso.
    if (saving) {
      return;
    }


    setError("");

    setSuccess("");


    // ==================================================
    // NORMALIZAR VALORES
    // ==================================================

    const parsedProductId =
      Number(productId);


    const parsedQuantity =
      Number(quantity);


    // ==================================================
    // VALIDAR PRODUCTO
    // ==================================================

    if (
      !Number.isInteger(parsedProductId) ||
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

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {

      setError(
        "La cantidad debe ser mayor que 0."
      );

      return;
    }


    // ==================================================
    // VALIDAR STOCK EN FRONTEND
    // ==================================================
    //
    // Esta validación mejora la experiencia
    // del usuario.
    //
    // El Backend vuelve a validar el stock
    // porque esa es la validación autoritativa.
    //
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

      setSaving(true);


      // ==================================================
      // POST /api/sales
      // ==================================================

      const response =
        await fetch(
          "/api/sales",
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              product_id:
                parsedProductId,

              cantidad:
                parsedQuantity
            })
          }
        );


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

      setSuccess(
        data.message ||
        "Venta registrada correctamente"
      );


      // Reiniciamos formulario.
      setProductId("");

      setQuantity(1);


      // ==================================================
      // ACTUALIZAR INFORMACIÓN
      // ==================================================
      //
      // Esto actualizará:
      //
      // - stock;
      // - historial.
      //
      await loadData();


    } catch (error) {

      setError(error.message);


    } finally {

      setSaving(false);
    }
  };


  // ==================================================
  // ABRIR MODAL DE ANULACIÓN
  // ==================================================
  //
  // Cuando el usuario pulsa "Anular",
  // guardamos la venta seleccionada
  // antes de mostrar el modal.
  //
  const openCancelModal = (sale) => {

    setSaleToCancel(sale);

    setCancelModalOpen(true);

    setError("");

    setSuccess("");
  };


  // ==================================================
  // CERRAR MODAL DE ANULACIÓN
  // ==================================================

  const closeCancelModal = () => {

    // No permitimos cerrar el modal mientras
    // el Backend está procesando la anulación.
    if (cancelling) {
      return;
    }


    setCancelModalOpen(false);

    setSaleToCancel(null);

    setError("");
  };


  // ==================================================
  // ANULAR VENTA
  // ==================================================
  //
  // PATCH /api/sales/:id/cancel
  //
  // El Frontend NO modifica directamente el stock.
  //
  // Solamente solicita la anulación.
  //
  // El Backend se encarga de:
  //
  // BEGIN TRANSACTION
  // ↓
  // buscar venta
  // ↓
  // devolver stock
  // ↓
  // marcar venta como anulada
  // ↓
  // COMMIT
  //
  const cancelSale = async () => {

    // Necesitamos una venta seleccionada.
    if (
      !saleToCancel ||
      cancelling
    ) {
      return;
    }


    try {

      setCancelling(true);

      setError("");

      setSuccess("");


      // ==================================================
      // SOLICITAR ANULACIÓN
      // ==================================================

      const response =
        await fetch(
          `/api/sales/${saleToCancel.id}/cancel`,
          {
            method: "PATCH",

            credentials: "include"
          }
        );


      const data =
        await response.json();


      // ==================================================
      // VALIDAR RESPUESTA
      // ==================================================

      if (!response.ok) {

        throw new Error(
          data.error ||
          "No se pudo anular la venta"
        );
      }


      // ==================================================
      // ANULACIÓN EXITOSA
      // ==================================================

      setSuccess(
        data.message ||
        `Venta #${saleToCancel.id} anulada correctamente`
      );


      // Cerramos el modal.
      setCancelModalOpen(false);

      setSaleToCancel(null);


      // ==================================================
      // RECARGAR INFORMACIÓN
      // ==================================================
      //
      // Esto actualiza:
      //
      // - historial;
      // - estado de la venta;
      // - stock disponible.
      //
      await loadData();


    } catch (error) {

      setError(error.message);


    } finally {

      setCancelling(false);
    }
  };


  // ==================================================
  // FORMATEAR FECHA
  // ==================================================

  const formatDate = (date) => {

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
  // INTERFAZ
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
          MENSAJE DE ERROR GENERAL
          ================================================== */}

      {error && !cancelModalOpen && (

        <div className="feedback-message error-message">

          <AlertCircle size={18} />

          {error}

        </div>

      )}


      {/* ==================================================
          ÁREA DE REGISTRO
          ================================================== */}

      <div className="sales-layout">


        {/* ==================================================
            FORMULARIO DE VENTA
            ================================================== */}

        <section className="sale-form-card">


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
                PRODUCTO
                ================================================ */}

            <div className="form-field">

              <label>
                Producto
              </label>


              <select
                className="sales-select"

                value={productId}

                onChange={(event) =>
                  setProductId(
                    event.target.value
                  )
                }
              >


                <option value="">
                  Seleccione un producto
                </option>


                {products.map(
                  (product) => (

                    <option
                      key={product.id}

                      value={product.id}

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
                INFORMACIÓN DEL PRODUCTO SELECCIONADO
                ================================================== */}

            {selectedProduct && (

              <div className="selected-product-card">


                <div className="selected-product-icon">

                  <Package size={20} />

                </div>


                <div>

                  <span>
                    Producto seleccionado
                  </span>

                  <strong>
                    {selectedProduct.nombre}
                  </strong>

                </div>


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

                min="1"

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
                REGISTRAR
                ================================================== */}

            <button
              type="submit"

              className="primary-button sale-submit-button"

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
            ENCABEZADO
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


          {/* Ahora hablamos de registros porque
              el historial también puede contener
              ventas anuladas. */}
          <span className="sales-count">

            {sales.length}{" "}

            {sales.length === 1
              ? "registro"
              : "registros"}

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
             TABLA
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

                  <th>
                    Estado
                  </th>

                  <th className="actions-column">
                    Acciones
                  </th>

                </tr>

              </thead>


              {/* ============================================
                  VENTAS
                  ============================================ */}

              <tbody>


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
                          FECHA DE VENTA
                          ================================== */}

                      <td>

                        {formatDate(
                          sale.created_at
                        )}

                      </td>


                      {/* ==================================
                          ESTADO
                          ================================== */}

                      <td>


                        {sale.estado === "anulada" ? (

                          <span className="stock-badge deleted-badge">

                            Anulada

                          </span>

                        ) : (

                          <span className="stock-badge stock-ok">

                            Completada

                          </span>

                        )}


                      </td>


                      {/* ==================================
                          ACCIONES
                          ================================== */}

                      <td>


                        {sale.estado === "completada" ? (

                          <button
                            type="button"

                            className="danger-button"

                            onClick={() =>
                              openCancelModal(
                                sale
                              )
                            }

                            disabled={cancelling}
                          >

                            <Ban size={16} />

                            Anular

                          </button>

                        ) : (

                          // Una venta anulada ya no
                          // permite ninguna acción.
                          <span>
                            —
                          </span>

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


      {/* ==================================================
          MODAL DE CONFIRMACIÓN DE ANULACIÓN
          ==================================================

          El modal solamente aparece si:

          cancelModalOpen = true

          y existe:

          saleToCancel
      */}

      {cancelModalOpen &&
        saleToCancel && (

          <div
            className="modal-backdrop-custom"

            // Permite cerrar haciendo clic
            // fuera del cuadro.
            onMouseDown={
              closeCancelModal
            }
          >


            <div
              className="delete-modal"

              // Evita que un clic dentro
              // del cuadro cierre el modal.
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >


              {/* ============================================
                  ICONO
                  ============================================ */}

              <div className="delete-modal-icon">

                <Ban size={24} />

              </div>


              {/* ============================================
                  INFORMACIÓN
                  ============================================ */}

              <div className="delete-modal-content">


                <h2>
                  Anular venta
                </h2>


                <p>

                  ¿Deseas anular la{" "}

                  <strong>
                    Venta #{saleToCancel.id}
                  </strong>

                  {" "}de{" "}

                  <strong>
                    {saleToCancel.producto}
                  </strong>

                  ?

                </p>


                <div className="delete-info">

                  Esta operación no eliminará
                  el registro del historial.

                  <br />

                  Las{" "}

                  <strong>
                    {saleToCancel.cantidad}
                  </strong>

                  {" "}unidades serán devueltas
                  automáticamente al inventario.

                </div>


                {/* ==========================================
                    ERROR DENTRO DEL MODAL
                    ========================================== */}

                {error && (

                  <div className="feedback-message error-message">

                    <AlertCircle size={18} />

                    {error}

                  </div>

                )}


              </div>


              {/* ============================================
                  BOTONES
                  ============================================ */}

              <div className="delete-modal-actions">


                <button
                  type="button"

                  className="secondary-button"

                  onClick={
                    closeCancelModal
                  }

                  disabled={cancelling}
                >

                  Cancelar

                </button>


                <button
                  type="button"

                  className="danger-button"

                  onClick={cancelSale}

                  disabled={cancelling}
                >

                  <Ban size={17} />


                  {cancelling
                    ? "Anulando..."
                    : "Anular venta"}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Sales;