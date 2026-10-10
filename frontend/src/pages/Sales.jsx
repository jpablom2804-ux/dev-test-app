import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  ShoppingCart,
  Package,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

function Sales() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // CARGAR PRODUCTOS Y VENTAS
  // ==================================================

  const loadData = async () => {
    try {
      setError("");

      const [productsResponse, salesResponse] =
        await Promise.all([
          fetch("/api/products", {
            credentials: "include"
          }),

          fetch("/api/sales", {
            credentials: "include"
          })
        ]);

      const productsData =
        await productsResponse.json();

      const salesData =
        await salesResponse.json();

      if (!productsResponse.ok) {
        throw new Error(
          productsData.error ||
            "No se pudieron cargar los productos"
        );
      }

      if (!salesResponse.ok) {
        throw new Error(
          salesData.error ||
            "No se pudieron cargar las ventas"
        );
      }

      setProducts(productsData);
      setSales(salesData);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==================================================
  // PRODUCTO SELECCIONADO
  // ==================================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        Number(product.id) === Number(productId)
    );
  }, [products, productId]);

  // ==================================================
  // REGISTRAR VENTA
  // ==================================================

  const handleSale = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const parsedProductId =
      Number(productId);

    const parsedQuantity =
      Number(quantity);

    if (
      !Number.isInteger(parsedProductId) ||
      parsedProductId <= 0
    ) {
      setError(
        "Seleccione un producto válido."
      );

      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "La cantidad debe ser mayor que 0."
      );

      return;
    }

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

      const response = await fetch(
        "/api/sales",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            product_id: parsedProductId,
            cantidad: parsedQuantity
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo registrar la venta"
        );
      }

      setSuccess(
        data.message ||
          "Venta registrada correctamente"
      );

      setProductId("");
      setQuantity(1);

      /*
       * Volvemos a consultar la API.
       *
       * De esta manera:
       * - aparece la nueva venta
       * - vemos el stock actualizado
       */
      await loadData();

    } catch (error) {
      setError(error.message);

    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // FORMATO FECHA
  // ==================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
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

  if (loading) {
    return (
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">

      {/* =========================================
          HEADER
          ========================================= */}

      <div className="products-header">
        <div>
          <span className="page-eyebrow">
            Gestión comercial
          </span>

          <h1>Ventas</h1>

          <p>
            Registra ventas y consulta los
            movimientos realizados
          </p>
        </div>
      </div>

      {/* =========================================
          FEEDBACK
          ========================================= */}

      {success && (
        <div className="feedback-message success-message">
          <CheckCircle size={18} />

          {success}
        </div>
      )}

      {error && (
        <div className="feedback-message error-message">
          <AlertCircle size={18} />

          {error}
        </div>
      )}

      {/* =========================================
          REGISTRAR VENTA
          ========================================= */}

      <div className="sales-layout">

        <section className="sale-form-card">

          <div className="sale-card-header">

            <div className="sale-header-icon">
              <ShoppingCart size={21} />
            </div>

            <div>
              <h2>Registrar venta</h2>

              <p>
                Selecciona un producto y la
                cantidad vendida
              </p>
            </div>

          </div>

          <form
            className="sale-form"
            onSubmit={handleSale}
          >

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

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={
                      Number(product.stock) === 0
                    }
                  >
                    {product.nombre}
                    {" — "}
                    Stock: {product.stock}
                  </option>
                ))}

              </select>

            </div>

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

            <button
              type="submit"
              className="primary-button sale-submit-button"
              disabled={
                saving ||
                !productId ||
                !selectedProduct ||
                Number(selectedProduct.stock) === 0
              }
            >
              <Plus size={18} />

              {saving
                ? "Registrando..."
                : "Registrar venta"}
            </button>

          </form>

        </section>

        {/* =========================================
            INFORMACIÓN
            ========================================= */}

        <section className="sale-info-card">

          <div className="sale-info-icon">
            <ShoppingCart size={25} />
          </div>

          <h3>¿Qué ocurre al vender?</h3>

          <p>
            Cuando registras una venta, el sistema
            guarda el movimiento y actualiza
            automáticamente el stock del producto.
          </p>

          <div className="sale-flow">

            <span>Registrar venta</span>

            <span>↓</span>

            <span>Guardar movimiento</span>

            <span>↓</span>

            <span>Actualizar stock</span>

            <span>↓</span>

            <span>Actualizar Dashboard</span>

          </div>

        </section>

      </div>

      {/* =========================================
          HISTORIAL
          ========================================= */}

      <section className="sales-history-card">

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

          <span className="sales-count">
            {sales.length}{" "}
            {sales.length === 1
              ? "venta"
              : "ventas"}
          </span>

        </div>

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

          <div className="table-responsive">

            <table className="products-table">

              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>

                {sales.map((sale) => (

                  <tr key={sale.id}>

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

                    <td>
                      <span className="sale-quantity-badge">
                        {sale.cantidad}{" "}
                        {sale.cantidad === 1
                          ? "unidad"
                          : "unidades"}
                      </span>
                    </td>

                    <td className="price-cell">
                      {Number(
                        sale.precio_unitario
                      ).toFixed(2)}
                    </td>

                    <td>
                      {formatDate(
                        sale.created_at
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default Sales;