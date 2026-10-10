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
// Los iconos provienen de lucide-react.
// Se utilizan solamente para mejorar
// visualmente la interfaz.
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  AlertTriangle,
  RotateCcw
} from "lucide-react";


// ==================================================
// ESTADO INICIAL DEL FORMULARIO
// ==================================================
//
// Utilizamos un objeto separado para poder
// reutilizarlo cuando:
//
// - creamos un producto;
// - cerramos el modal;
// - terminamos de guardar un producto.
//
const initialForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: ""
};


// ==================================================
// COMPONENTE PRODUCTS
// ==================================================
//
// Esta página permite:
//
// - consultar productos activos;
// - buscar productos;
// - crear productos;
// - editar productos;
// - mover productos a la papelera;
// - consultar la papelera;
// - restaurar productos.
//
function Products() {


  // ==================================================
  // PRODUCTOS
  // ==================================================

  // Lista de productos que tienen activo = 1.
  const [
    activeProducts,
    setActiveProducts
  ] = useState([]);


  // Lista de productos que tienen activo = 0.
  //
  // Estos son los productos que se encuentran
  // en la papelera mediante Soft Delete.
  const [
    deletedProducts,
    setDeletedProducts
  ] = useState([]);


  // ==================================================
  // PESTAÑAS
  // ==================================================

  // Indica qué pestaña está seleccionada.
  //
  // "active"
  // → productos activos
  //
  // "deleted"
  // → papelera
  const [
    activeTab,
    setActiveTab
  ] = useState("active");


  // ==================================================
  // FORMULARIO
  // ==================================================

  // Guarda los valores actuales
  // del formulario crear/editar.
  const [
    form,
    setForm
  ] = useState(initialForm);


  // Guarda el ID del producto que
  // actualmente se está editando.
  //
  // null significa que estamos creando
  // un producto nuevo.
  const [
    editingId,
    setEditingId
  ] = useState(null);


  // ==================================================
  // BÚSQUEDA
  // ==================================================

  // Guarda el texto escrito
  // en el campo de búsqueda.
  const [
    search,
    setSearch
  ] = useState("");


  // ==================================================
  // MODAL CREAR / EDITAR
  // ==================================================

  // Controla si el modal del formulario
  // está abierto o cerrado.
  const [
    modalOpen,
    setModalOpen
  ] = useState(false);


  // ==================================================
  // MODAL ELIMINAR
  // ==================================================

  // Controla si el modal de confirmación
  // de eliminación está abierto.
  const [
    deleteModalOpen,
    setDeleteModalOpen
  ] = useState(false);


  // Guarda temporalmente el producto
  // que el usuario desea eliminar.
  const [
    productToDelete,
    setProductToDelete
  ] = useState(null);


  // ==================================================
  // ESTADOS DE CARGA
  // ==================================================

  // loading se utiliza mientras ejecutamos
  // operaciones como:
  //
  // - crear;
  // - editar;
  // - eliminar;
  // - restaurar.
  const [
    loading,
    setLoading
  ] = useState(false);


  // pageLoading se utiliza específicamente
  // mientras cargamos inicialmente
  // las listas de productos.
  const [
    pageLoading,
    setPageLoading
  ] = useState(true);


  // ==================================================
  // MENSAJES
  // ==================================================

  // Mensaje de operación exitosa.
  const [
    message,
    setMessage
  ] = useState("");


  // Mensaje de error.
  const [
    error,
    setError
  ] = useState("");


  // ==================================================
  // CARGAR PRODUCTOS
  // ==================================================
  //
  // Esta función consulta dos endpoints:
  //
  // GET /api/products
  // → productos activos
  //
  // GET /api/products/deleted
  // → productos eliminados
  //
  // Ambos endpoints se ejecutan al mismo tiempo
  // utilizando Promise.all().
  //
  const loadProducts = async () => {

    try {

      // Indicamos que comenzó
      // la carga de información.
      setPageLoading(true);

      // Limpiamos errores anteriores.
      setError("");


      // ==================================================
      // REALIZAR PETICIONES EN PARALELO
      // ==================================================

      // Promise.all permite hacer ambas solicitudes
      // al mismo tiempo.
      //
      // productos activos ─────┐
      //                        ├── simultáneamente
      // papelera ──────────────┘
      //
      const [
        activeResponse,
        deletedResponse
      ] = await Promise.all([

        fetch("/api/products"),

        fetch("/api/products/deleted")

      ]);


      // ==================================================
      // CONVERTIR RESPUESTAS JSON
      // ==================================================

      const activeData =
        await activeResponse.json();

      const deletedData =
        await deletedResponse.json();


      // ==================================================
      // VALIDAR RESPUESTA DE PRODUCTOS ACTIVOS
      // ==================================================

      if (!activeResponse.ok) {

        throw new Error(
          activeData.error ||
          "No se pudieron cargar los productos"
        );
      }


      // ==================================================
      // VALIDAR RESPUESTA DE PAPELERA
      // ==================================================

      if (!deletedResponse.ok) {

        throw new Error(
          deletedData.error ||
          "No se pudo cargar la papelera"
        );
      }


      // ==================================================
      // GUARDAR INFORMACIÓN
      // ==================================================

      // Guardamos productos activos.
      setActiveProducts(activeData);

      // Guardamos productos eliminados.
      setDeletedProducts(deletedData);

    } catch (error) {

      // Mostramos cualquier error
      // ocurrido durante la carga.
      setError(error.message);

    } finally {

      // La carga termina independientemente
      // de que funcione o falle.
      setPageLoading(false);
    }
  };


  // ==================================================
  // CARGA INICIAL
  // ==================================================

  // Cuando Products se monta,
  // ejecutamos loadProducts().
  useEffect(() => {

    loadProducts();

    // [] indica que se ejecuta
    // al montar inicialmente el componente.
  }, []);


  // ==================================================
  // PRODUCTOS SEGÚN PESTAÑA
  // ==================================================

  // Seleccionamos qué lista utilizar dependiendo
  // de la pestaña actual.
  //
  // active
  // → activeProducts
  //
  // deleted
  // → deletedProducts
  //
  const currentProducts =
    activeTab === "active"
      ? activeProducts
      : deletedProducts;


  // ==================================================
  // BÚSQUEDA DE PRODUCTOS
  // ==================================================
  //
  // useMemo evita recalcular el filtro
  // si currentProducts y search no cambiaron.
  //
  const filteredProducts =
    useMemo(() => {

      // Convertimos la búsqueda a minúsculas
      // y eliminamos espacios innecesarios.
      const text =
        search.toLowerCase().trim();


      // Si no existe texto de búsqueda,
      // mostramos todos los productos
      // de la pestaña actual.
      if (!text) {
        return currentProducts;
      }


      // filter() conserva únicamente
      // los productos que coinciden.
      return currentProducts.filter(
        (product) => {

          return (

            // Buscar por nombre.
            product.nombre
              .toLowerCase()
              .includes(text) ||

            // Buscar por descripción.
            //
            // Si descripcion es null,
            // utilizamos un string vacío.
            (product.descripcion || "")
              .toLowerCase()
              .includes(text)
          );
        }
      );

    }, [
      currentProducts,
      search
    ]);


  // ==================================================
  // ACTUALIZAR FORMULARIO
  // ==================================================

  // Esta función sirve para todos
  // los campos del formulario.
  //
  // Ejemplo:
  //
  // name="nombre"
  // value="Monitor"
  //
  // actualiza:
  //
  // form.nombre = "Monitor"
  //
  const handleChange = (event) => {

    setForm({

      // Conservamos las demás propiedades.
      ...form,

      // Modificamos únicamente
      // el campo que generó el evento.
      [event.target.name]:
        event.target.value

    });
  };


  // ==================================================
  // ABRIR MODAL PARA CREAR
  // ==================================================

  const openCreateModal = () => {

    // null significa que no estamos editando.
    setEditingId(null);

    // Limpiamos el formulario.
    setForm(initialForm);

    // Limpiamos errores anteriores.
    setError("");

    // Abrimos el modal.
    setModalOpen(true);
  };


  // ==================================================
  // ABRIR MODAL PARA EDITAR
  // ==================================================

  const openEditModal = (product) => {

    // Guardamos el ID del producto
    // que se desea editar.
    setEditingId(product.id);


    // Cargamos los datos actuales
    // dentro del formulario.
    setForm({
      nombre: product.nombre,

      descripcion:
        product.descripcion || "",

      precio:
        product.precio,

      stock:
        product.stock
    });


    setError("");

    setModalOpen(true);
  };


  // ==================================================
  // CERRAR MODAL CREAR / EDITAR
  // ==================================================

  const closeModal = () => {

    // Si existe una operación en proceso,
    // no permitimos cerrar el modal.
    if (loading) {
      return;
    }


    setModalOpen(false);

    // Dejamos de estar en modo edición.
    setEditingId(null);

    // Restauramos formulario inicial.
    setForm(initialForm);

    // Limpiamos errores.
    setError("");
  };


  // ==================================================
  // CREAR / EDITAR PRODUCTO
  // ==================================================
  //
  // Esta misma función sirve para ambas operaciones.
  //
  // Si editingId existe:
  //
  // PUT /api/products/:id
  //
  // Si editingId es null:
  //
  // POST /api/products
  //
  const handleSubmit = async (event) => {

    // Evita que el formulario
    // recargue la página completa.
    event.preventDefault();


    // Evitamos múltiples solicitudes simultáneas.
    if (loading) {
      return;
    }


    setLoading(true);

    setError("");

    setMessage("");


    // ==================================================
    // DETERMINAR MÉTODO HTTP
    // ==================================================

    // Si existe editingId estamos actualizando.
    //
    // Si no existe estamos creando.
    const method =
      editingId
        ? "PUT"
        : "POST";


    // ==================================================
    // DETERMINAR ENDPOINT
    // ==================================================

    const url =
      editingId
        ? `/api/products/${editingId}`
        : "/api/products";


    try {

      // ==================================================
      // ENVIAR PRODUCTO AL BACKEND
      // ==================================================

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json"
          },

          // Convertimos el objeto JavaScript
          // a JSON antes de enviarlo.
          body: JSON.stringify({

            nombre:
              form.nombre,

            descripcion:
              form.descripcion,

            // Los inputs HTML entregan valores
            // como texto, por eso convertimos
            // precio y stock a Number.
            precio:
              Number(form.precio),

            stock:
              Number(form.stock)
          })
        }
      );


      // Convertimos respuesta
      // del Backend a JavaScript.
      const data =
        await response.json();


      // ==================================================
      // VALIDAR RESPUESTA
      // ==================================================

      if (!response.ok) {

        throw new Error(
          data.error ||
          "No se pudo guardar el producto"
        );
      }


      // ==================================================
      // MENSAJE DE ÉXITO
      // ==================================================

      setMessage(
        editingId
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );


      // Cerramos modal.
      setModalOpen(false);

      // Salimos del modo edición.
      setEditingId(null);

      // Limpiamos formulario.
      setForm(initialForm);


      // ==================================================
      // ACTUALIZAR LISTADO
      // ==================================================

      // Volvemos a consultar el Backend
      // para mostrar información actualizada.
      await loadProducts();

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);
    }
  };


  // ==================================================
  // ABRIR MODAL ELIMINAR
  // ==================================================

  const openDeleteModal = (product) => {

    // Guardamos qué producto
    // desea eliminar el usuario.
    setProductToDelete(product);

    setDeleteModalOpen(true);

    setError("");

    setMessage("");
  };


  // ==================================================
  // CERRAR MODAL ELIMINAR
  // ==================================================

  const closeDeleteModal = () => {

    if (loading) {
      return;
    }


    setDeleteModalOpen(false);

    setProductToDelete(null);
  };


  // ==================================================
  // SOFT DELETE
  // ==================================================
  //
  // DELETE /api/products/:id
  //
  // Aunque utilizamos HTTP DELETE,
  // el Backend NO elimina físicamente
  // el registro de MariaDB.
  //
  // Internamente hace:
  //
  // activo = 0
  //
  // Esto permite restaurarlo posteriormente.
  //
  const deleteProduct = async () => {

    // Necesitamos un producto seleccionado
    // y ninguna operación en proceso.
    if (
      !productToDelete ||
      loading
    ) {
      return;
    }


    try {

      setLoading(true);

      setError("");

      setMessage("");


      // ==================================================
      // SOLICITAR ELIMINACIÓN
      // ==================================================

      const response = await fetch(
        `/api/products/${productToDelete.id}`,
        {
          method: "DELETE"
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
          "No se pudo mover el producto a la papelera"
        );
      }


      // ==================================================
      // OPERACIÓN EXITOSA
      // ==================================================

      setMessage(
        `"${productToDelete.nombre}" fue movido a la papelera.`
      );


      // Cerramos el modal.
      setDeleteModalOpen(false);

      // Limpiamos producto seleccionado.
      setProductToDelete(null);


      // Actualizamos las listas.
      await loadProducts();

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);
    }
  };


  // ==================================================
  // RESTAURAR PRODUCTO
  // ==================================================
  //
  // PATCH /api/products/:id/restore
  //
  // Backend cambia:
  //
  // activo = 0
  //
  // a:
  //
  // activo = 1
  //
  const restoreProduct = async (product) => {

    if (loading) {
      return;
    }


    try {

      setLoading(true);

      setError("");

      setMessage("");


      // ==================================================
      // SOLICITAR RESTAURACIÓN
      // ==================================================

      const response = await fetch(
        `/api/products/${product.id}/restore`,
        {
          method: "PATCH"
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "No se pudo restaurar el producto"
        );
      }


      // Mensaje exitoso.
      setMessage(
        `"${product.nombre}" fue restaurado correctamente.`
      );


      // Volvemos a consultar las listas.
      await loadProducts();

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);
    }
  };


  // ==================================================
  // ESTADO DEL STOCK
  // ==================================================
  //
  // Devuelve:
  //
  // - texto que debe mostrarse;
  // - clase CSS que debe utilizarse.
  //
  const getStockStatus = (stock) => {

    const amount =
      Number(stock);


    // ==================================================
    // SIN STOCK
    // ==================================================

    if (amount === 0) {

      return {
        text: "Sin stock",
        className:
          "stock-badge stock-out"
      };
    }


    // ==================================================
    // STOCK BAJO
    // ==================================================

    // Entre 1 y 5 unidades.
    if (amount <= 5) {

      return {
        text: "Stock bajo",
        className:
          "stock-badge stock-low"
      };
    }


    // ==================================================
    // STOCK NORMAL
    // ==================================================

    // Más de 5 unidades.
    return {
      text: "En stock",
      className:
        "stock-badge stock-ok"
    };
  };


  // ==================================================
  // CAMBIAR PESTAÑA
  // ==================================================

  const changeTab = (tab) => {

    // Cambiamos entre:
    //
    // active
    // deleted
    setActiveTab(tab);


    // Limpiamos búsqueda para evitar
    // conservar filtros entre pestañas.
    setSearch("");


    // Limpiamos mensajes anteriores.
    setMessage("");

    setError("");
  };


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (

    <div className="products-page">


      {/* ==================================================
          ENCABEZADO
          ================================================== */}

      <div className="products-header">

        <div>

          <span className="page-eyebrow">
            Inventario
          </span>

          <h1>
            Productos
          </h1>

          <p>
            Administra los productos disponibles en el catálogo.
          </p>

        </div>


        {/* El botón Nuevo producto solamente
            aparece en la pestaña Activos. */}
        {activeTab === "active" && (

          <button
            className="primary-button"
            onClick={openCreateModal}
          >

            <Plus size={18} />

            Nuevo producto

          </button>

        )}

      </div>


      {/* ==================================================
          PESTAÑAS
          ================================================== */}

      <div className="product-tabs">


        {/* ================================================
            PRODUCTOS ACTIVOS
            ================================================ */}

        <button
          className={
            activeTab === "active"
              ? "product-tab active"
              : "product-tab"
          }
          onClick={() =>
            changeTab("active")
          }
        >

          Activos

          <span className="tab-count">
            {activeProducts.length}
          </span>

        </button>


        {/* ================================================
            PAPELERA
            ================================================ */}

        <button
          className={
            activeTab === "deleted"
              ? "product-tab active"
              : "product-tab"
          }
          onClick={() =>
            changeTab("deleted")
          }
        >

          Papelera

          <span className="tab-count">
            {deletedProducts.length}
          </span>

        </button>

      </div>


      {/* ==================================================
          MENSAJE DE ÉXITO
          ================================================== */}

      {message && (

        <div className="feedback-message success-message">
          {message}
        </div>

      )}


      {/* ==================================================
          ERROR GENERAL
          ================================================== */}

      {/* Los errores de los modales se muestran
          dentro de su propio modal.

          Por eso este mensaje general solamente
          aparece si ningún modal está abierto. */}
      {error &&
        !modalOpen &&
        !deleteModalOpen && (

          <div className="feedback-message error-message">

            <AlertTriangle size={18} />

            {error}

          </div>

        )}


      {/* ==================================================
          BARRA DE HERRAMIENTAS
          ================================================== */}

      <div className="products-toolbar">


        {/* ================================================
            BÚSQUEDA
            ================================================ */}

        <div className="search-box">

          <Search size={18} />


          <input
            type="text"

            // El placeholder cambia según
            // la pestaña seleccionada.
            placeholder={
              activeTab === "active"
                ? "Buscar productos activos..."
                : "Buscar en la papelera..."
            }

            value={search}

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {/* ================================================
            CONTADOR
            ================================================ */}

        <div className="product-counter">

          <Package size={18} />

          {filteredProducts.length}

          {activeTab === "active"
            ? " productos activos"
            : " en papelera"}

        </div>

      </div>


      {/* ==================================================
          TARJETA DE PRODUCTOS
          ================================================== */}

      <div className="products-card">


        {/* ==================================================
            CARGANDO
            ================================================== */}

        {pageLoading ? (

          <div className="products-empty">

            <p>
              Cargando productos...
            </p>

          </div>


        ) : filteredProducts.length === 0 ? (


          /* ==================================================
             SIN RESULTADOS
             ================================================== */

          <div className="products-empty">


            <div className="empty-icon">

              {activeTab === "active"
                ? <Package size={30} />
                : <Trash2 size={30} />}

            </div>


            <h3>

              {activeTab === "active"
                ? "No hay productos"
                : "La papelera está vacía"}

            </h3>


            <p>

              {activeTab === "active"
                ? "No encontramos productos que coincidan con tu búsqueda."
                : "No hay productos eliminados actualmente."}

            </p>


            {/* Si no existe ningún producto activo,
                ofrecemos crear el primero. */}
            {activeTab === "active" &&
              activeProducts.length === 0 && (

                <button
                  className="primary-button empty-create-button"
                  onClick={openCreateModal}
                >

                  <Plus size={18} />

                  Crear primer producto

                </button>

              )}

          </div>


        ) : (


          /* ==================================================
             TABLA DE PRODUCTOS
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
                    Precio
                  </th>

                  <th>
                    Stock
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
                  CUERPO
                  ============================================ */}

              <tbody>


                {/* map() recorre todos los productos
                    filtrados y crea una fila por producto. */}
                {filteredProducts.map(
                  (product) => {

                    // Calculamos cómo debe mostrarse
                    // visualmente el stock.
                    const stockStatus =
                      getStockStatus(
                        product.stock
                      );


                    return (

                      <tr key={product.id}>


                        {/* ==================================
                            PRODUCTO
                            ================================== */}

                        <td>

                          <div className="product-info">


                            <div className="product-avatar">

                              <Package size={19} />

                            </div>


                            <div>

                              <strong>
                                {product.nombre}
                              </strong>


                              <span>

                                {product.descripcion ||
                                  "Sin descripción"}

                              </span>

                            </div>

                          </div>

                        </td>


                        {/* ==================================
                            PRECIO
                            ================================== */}

                        <td className="price-cell">

                          $

                          {Number(
                            product.precio
                          ).toFixed(2)}

                        </td>


                        {/* ==================================
                            STOCK
                            ================================== */}

                        <td>
                          {product.stock}
                        </td>


                        {/* ==================================
                            ESTADO
                            ================================== */}

                        <td>


                          {activeTab === "active" ? (


                            // Producto activo:
                            // mostramos su estado de stock.
                            <span
                              className={
                                stockStatus.className
                              }
                            >

                              {stockStatus.text}

                            </span>


                          ) : (


                            // Producto eliminado:
                            // mostramos estado Papelera.
                            <span className="stock-badge deleted-badge">

                              En papelera

                            </span>

                          )}


                        </td>


                        {/* ==================================
                            ACCIONES
                            ================================== */}

                        <td>


                          {activeTab === "active" ? (


                            // =================================
                            // ACCIONES PRODUCTO ACTIVO
                            // =================================

                            <div className="table-actions">


                              {/* Editar */}
                              <button
                                className="icon-button"
                                title="Editar producto"
                                onClick={() =>
                                  openEditModal(
                                    product
                                  )
                                }
                              >

                                <Pencil size={17} />

                              </button>


                              {/* Mover a papelera */}
                              <button
                                className="icon-button danger"
                                title="Mover a papelera"
                                onClick={() =>
                                  openDeleteModal(
                                    product
                                  )
                                }
                              >

                                <Trash2 size={17} />

                              </button>

                            </div>


                          ) : (


                            // =================================
                            // RESTAURAR PRODUCTO
                            // =================================

                            <button
                              className="restore-button"
                              onClick={() =>
                                restoreProduct(
                                  product
                                )
                              }
                              disabled={loading}
                            >

                              <RotateCcw size={16} />

                              Restaurar

                            </button>

                          )}


                        </td>

                      </tr>

                    );
                  }
                )}


              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ==================================================
          MODAL ELIMINAR
          ================================================== */}

      {/* Solamente existe si:
          - deleteModalOpen = true
          - existe productToDelete */}
      {deleteModalOpen &&
        productToDelete && (

          // Fondo oscuro del modal.
          //
          // Si hacemos clic fuera del cuadro,
          // cerramos el modal.
          <div
            className="modal-backdrop-custom"
            onMouseDown={
              closeDeleteModal
            }
          >


            <div
              className="delete-modal"

              // Evita que un clic dentro del modal
              // llegue hasta el fondo y lo cierre.
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >


              {/* Icono */}
              <div className="delete-modal-icon">

                <Trash2 size={24} />

              </div>


              {/* Contenido */}
              <div className="delete-modal-content">

                <h2>
                  Mover a papelera
                </h2>


                <p>

                  ¿Deseas mover{" "}

                  <strong>
                    {productToDelete.nombre}
                  </strong>{" "}

                  a la papelera?

                </p>


                <div className="delete-info">

                  El producto no se eliminará
                  permanentemente. Podrás restaurarlo
                  posteriormente desde la papelera.

                </div>

              </div>


              {/* Acciones */}
              <div className="delete-modal-actions">


                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={loading}
                >

                  Cancelar

                </button>


                <button
                  type="button"
                  className="danger-button"
                  onClick={deleteProduct}
                  disabled={loading}
                >

                  <Trash2 size={17} />


                  {loading
                    ? "Moviendo..."
                    : "Mover a papelera"}

                </button>

              </div>

            </div>

          </div>

        )}


      {/* ==================================================
          MODAL CREAR / EDITAR
          ================================================== */}

      {modalOpen && (

        // Clic fuera del modal
        // intenta cerrarlo.
        <div
          className="modal-backdrop-custom"
          onMouseDown={closeModal}
        >


          <div
            className="product-modal"

            // Evita cerrar el modal al hacer
            // clic dentro de él.
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >


            {/* ==============================================
                ENCABEZADO DEL MODAL
                ============================================== */}

            <div className="modal-header-custom">


              <div>

                <span className="page-eyebrow">

                  {editingId
                    ? "Editar registro"
                    : "Nuevo registro"}

                </span>


                <h2>

                  {editingId
                    ? "Editar producto"
                    : "Nuevo producto"}

                </h2>

              </div>


              {/* Botón cerrar */}
              <button
                className="modal-close"
                onClick={closeModal}
                disabled={loading}
              >

                <X size={20} />

              </button>

            </div>


            {/* ==============================================
                FORMULARIO
                ============================================== */}

            <form
              onSubmit={handleSubmit}
              className="product-modal-form"
            >


              {/* ============================================
                  NOMBRE
                  ============================================ */}

              <div className="form-field">

                <label htmlFor="nombre">
                  Nombre
                </label>


                <input
                  id="nombre"
                  name="nombre"
                  type="text"

                  placeholder="Ej. Monitor Gaming"

                  value={form.nombre}

                  onChange={
                    handleChange
                  }

                  // Validación básica del navegador.
                  required

                  disabled={loading}

                  // Coincide con la validación
                  // del Backend y la columna DB.
                  maxLength={100}
                />

              </div>


              {/* ============================================
                  DESCRIPCIÓN
                  ============================================ */}

              <div className="form-field">

                <label htmlFor="descripcion">
                  Descripción
                </label>


                <textarea
                  id="descripcion"
                  name="descripcion"

                  placeholder="Descripción del producto"

                  value={
                    form.descripcion
                  }

                  onChange={
                    handleChange
                  }

                  disabled={loading}

                  rows="3"

                  // Coincide con la validación
                  // del Backend.
                  maxLength={255}
                />

              </div>


              {/* ============================================
                  PRECIO Y STOCK
                  ============================================ */}

              <div className="form-row">


                {/* Precio */}
                <div className="form-field">

                  <label htmlFor="precio">
                    Precio
                  </label>


                  <input
                    id="precio"
                    name="precio"
                    type="number"

                    // Permite decimales
                    // de dos posiciones.
                    step="0.01"

                    // No permite precio negativo
                    // desde la interfaz.
                    min="0"

                    placeholder="0.00"

                    value={
                      form.precio
                    }

                    onChange={
                      handleChange
                    }

                    required

                    disabled={loading}
                  />

                </div>


                {/* Stock */}
                <div className="form-field">

                  <label htmlFor="stock">
                    Stock
                  </label>


                  <input
                    id="stock"
                    name="stock"
                    type="number"

                    // No permite cantidades negativas.
                    min="0"

                    // Stock debe ser entero.
                    step="1"

                    placeholder="0"

                    value={
                      form.stock
                    }

                    onChange={
                      handleChange
                    }

                    required

                    disabled={loading}
                  />

                </div>

              </div>


              {/* ============================================
                  ERROR DEL FORMULARIO
                  ============================================ */}

              {error && (

                <div className="feedback-message error-message">

                  <AlertTriangle size={18} />

                  {error}

                </div>

              )}


              {/* ============================================
                  BOTONES DEL FORMULARIO
                  ============================================ */}

              <div className="modal-actions">


                {/* Cancelar */}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={loading}
                >

                  Cancelar

                </button>


                {/* Guardar */}
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >

                  {loading

                    // Mientras se procesa la solicitud.
                    ? "Guardando..."

                    // Si hay editingId,
                    // estamos editando.
                    : editingId
                      ? "Guardar cambios"

                      // Si no existe editingId,
                      // estamos creando.
                      : "Crear producto"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Products;