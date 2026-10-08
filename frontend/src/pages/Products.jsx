import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  AlertTriangle
} from "lucide-react";

const initialForm = {
  nombre: "",
  descripcion: "",
  precio: "",
  stock: ""
};

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron cargar los productos"
        );
      }

      setProducts(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.nombre.toLowerCase().includes(text) ||
        (product.descripcion || "")
          .toLowerCase()
          .includes(text)
      );
    });
  }, [products, search]);

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
          data.error || "No se pudo guardar el producto"
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

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar "${product.nombre}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo eliminar el producto"
        );
      }

      setMessage("Producto eliminado correctamente.");

      await loadProducts();
    } catch (error) {
      setError(error.message);
    }
  };

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

  return (
    <div className="products-page">

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

        <button
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Nuevo producto
        </button>
      </div>

      {message && (
        <div className="feedback-message success-message">
          {message}
        </div>
      )}

      {error && !modalOpen && (
        <div className="feedback-message error-message">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="products-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="product-counter">
          <Package size={18} />
          {filteredProducts.length} productos
        </div>
      </div>

      <div className="products-card">

        {pageLoading ? (
          <div className="products-empty">
            <p>Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="products-empty">
            <div className="empty-icon">
              <Package size={30} />
            </div>

            <h3>No hay productos</h3>

            <p>
              No encontramos productos que coincidan con tu búsqueda.
            </p>
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
                        <span
                          className={
                            stockStatus.className
                          }
                        >
                          {stockStatus.text}
                        </span>
                      </td>

                      <td>
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
                            title="Eliminar producto"
                            onClick={() =>
                              deleteProduct(product)
                            }
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

      </div>

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