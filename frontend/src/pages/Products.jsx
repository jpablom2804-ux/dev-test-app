import { useEffect, useMemo, useState } from "react";
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

const initialForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: ""
};

function Products() {
  // Productos
  const [activeProducts, setActiveProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);

  // Pestañas
  const [activeTab, setActiveTab] = useState("active");

  // Formulario
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // Búsqueda
  const [search, setSearch] = useState("");

  // Modal crear / editar
  const [modalOpen, setModalOpen] = useState(false);

  // Modal eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Estados
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Mensajes
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==================================================
  // CARGAR PRODUCTOS
  // ==================================================

  const loadProducts = async () => {
    try {
      setPageLoading(true);
      setError("");

      const [activeResponse, deletedResponse] =
        await Promise.all([
          fetch("/api/products"),
          fetch("/api/products/deleted")
        ]);

      const activeData = await activeResponse.json();
      const deletedData = await deletedResponse.json();

      if (!activeResponse.ok) {
        throw new Error(
          activeData.error ||
            "No se pudieron cargar los productos"
        );
      }

      if (!deletedResponse.ok) {
        throw new Error(
          deletedData.error ||
            "No se pudo cargar la papelera"
        );
      }

      setActiveProducts(activeData);
      setDeletedProducts(deletedData);
    } catch (error) {
      setError(error.message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ==================================================
  // PRODUCTOS SEGÚN PESTAÑA
  // ==================================================

  const currentProducts =
    activeTab === "active"
      ? activeProducts
      : deletedProducts;

  // ==================================================
  // BÚSQUEDA
  // ==================================================

  const filteredProducts = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) {
      return currentProducts;
    }

    return currentProducts.filter((product) => {
      return (
        product.nombre.toLowerCase().includes(text) ||
        (product.descripcion || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [currentProducts, search]);

  // ==================================================
  // FORMULARIO
  // ==================================================

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);

    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || "",
      precio: product.precio,
      stock: product.stock
    });

    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (loading) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  // ==================================================
  // CREAR / EDITAR
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    const method = editingId ? "PUT" : "POST";

    const url = editingId
      ? `/api/products/${editingId}`
      : "/api/products";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: Number(form.precio),
          stock: Number(form.stock)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo guardar el producto"
        );
      }

      setMessage(
        editingId
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);

      await loadProducts();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // MODAL ELIMINAR
  // ==================================================

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
    setError("");
    setMessage("");
  };

  const closeDeleteModal = () => {
    if (loading) return;

    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  // ==================================================
  // SOFT DELETE
  // ==================================================

  const deleteProduct = async () => {
    if (!productToDelete || loading) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/products/${productToDelete.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo mover el producto a la papelera"
        );
      }

      setMessage(
        `"${productToDelete.nombre}" fue movido a la papelera.`
      );

      setDeleteModalOpen(false);
      setProductToDelete(null);

      await loadProducts();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // RESTAURAR
  // ==================================================

  const restoreProduct = async (product) => {
    if (loading) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/products/${product.id}/restore`,
        {
          method: "PATCH"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo restaurar el producto"
        );
      }

      setMessage(
        `"${product.nombre}" fue restaurado correctamente.`
      );

      await loadProducts();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ESTADO DE STOCK
  // ==================================================

  const getStockStatus = (stock) => {
    const amount = Number(stock);

    if (amount === 0) {
      return {
        text: "Sin stock",
        className: "stock-badge stock-out"
      };
    }

    if (amount <= 5) {
      return {
        text: "Stock bajo",
        className: "stock-badge stock-low"
      };
    }

    return {
      text: "En stock",
      className: "stock-badge stock-ok"
    };
  };

  // ==================================================
  // CAMBIAR PESTAÑA
  // ==================================================

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setMessage("");
    setError("");
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="products-page">

      {/* HEADER */}
      <div className="products-header">
        <div>
          <span className="page-eyebrow">
            Inventario
          </span>

          <h1>Productos</h1>

          <p>
            Administra los productos disponibles en el catálogo.
          </p>
        </div>

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

      {/* TABS */}
      <div className="product-tabs">

        <button
          className={
            activeTab === "active"
              ? "product-tab active"
              : "product-tab"
          }
          onClick={() => changeTab("active")}
        >
          Activos

          <span className="tab-count">
            {activeProducts.length}
          </span>
        </button>

        <button
          className={
            activeTab === "deleted"
              ? "product-tab active"
              : "product-tab"
          }
          onClick={() => changeTab("deleted")}
        >
          Papelera

          <span className="tab-count">
            {deletedProducts.length}
          </span>
        </button>

      </div>

      {/* MENSAJE DE ÉXITO */}
      {message && (
        <div className="feedback-message success-message">
          {message}
        </div>
      )}

      {/* ERROR GENERAL */}
      {error && !modalOpen && !deleteModalOpen && (
        <div className="feedback-message error-message">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="products-toolbar">

        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder={
              activeTab === "active"
                ? "Buscar productos activos..."
                : "Buscar en la papelera..."
            }
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="product-counter">
          <Package size={18} />

          {filteredProducts.length}

          {activeTab === "active"
            ? " productos activos"
            : " en papelera"}
        </div>

      </div>

      {/* TABLA */}
      <div className="products-card">

        {pageLoading ? (

          <div className="products-empty">
            <p>Cargando productos...</p>
          </div>

        ) : filteredProducts.length === 0 ? (

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

          <div className="table-responsive">

            <table className="products-table">

              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>

                  <th className="actions-column">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map((product) => {
                  const stockStatus =
                    getStockStatus(product.stock);

                  return (
                    <tr key={product.id}>

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

                      <td className="price-cell">
                        $
                        {Number(
                          product.precio
                        ).toFixed(2)}
                      </td>

                      <td>
                        {product.stock}
                      </td>

                      <td>

                        {activeTab === "active" ? (

                          <span
                            className={
                              stockStatus.className
                            }
                          >
                            {stockStatus.text}
                          </span>

                        ) : (

                          <span className="stock-badge deleted-badge">
                            En papelera
                          </span>

                        )}

                      </td>

                      <td>

                        {activeTab === "active" ? (

                          <div className="table-actions">

                            <button
                              className="icon-button"
                              title="Editar producto"
                              onClick={() =>
                                openEditModal(product)
                              }
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              className="icon-button danger"
                              title="Mover a papelera"
                              onClick={() =>
                                openDeleteModal(product)
                              }
                            >
                              <Trash2 size={17} />
                            </button>

                          </div>

                        ) : (

                          <button
                            className="restore-button"
                            onClick={() =>
                              restoreProduct(product)
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
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ==================================================
          MODAL ELIMINAR
          ================================================== */}

      {deleteModalOpen && productToDelete && (
        <div
          className="modal-backdrop-custom"
          onMouseDown={closeDeleteModal}
        >
          <div
            className="delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <div className="delete-modal-content">

              <h2>Mover a papelera</h2>

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

            <div className="delete-modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={closeDeleteModal}
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
        <div
          className="modal-backdrop-custom"
          onMouseDown={closeModal}
        >
          <div
            className="product-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

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

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={loading}
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="product-modal-form"
            >

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
                  onChange={handleChange}
                  required
                  disabled={loading}
                  maxLength={100}
                />

              </div>

              <div className="form-field">

                <label htmlFor="descripcion">
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Descripción del producto"
                  value={form.descripcion}
                  onChange={handleChange}
                  disabled={loading}
                  rows="3"
                  maxLength={255}
                />

              </div>

              <div className="form-row">

                <div className="form-field">

                  <label htmlFor="precio">
                    Precio
                  </label>

                  <input
                    id="precio"
                    name="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.precio}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />

                </div>

                <div className="form-field">

                  <label htmlFor="stock">
                    Stock
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />

                </div>

              </div>

              {error && (
                <div className="feedback-message error-message">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
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

export default Products;