import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Ban,
  Trophy,
  Clock,
} from "lucide-react";

function Dashboard() {
  const [products, setProducts] = useState([]);

  const [salesSummary, setSalesSummary] = useState({
    unidades_vendidas: 0,
    productos_mas_vendidos: [],
    ventas_recientes: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        /*
         * Cargamos productos y ventas al mismo tiempo.
         */
        const [productsResponse, salesResponse] = await Promise.all([
          fetch("/api/products", {
            credentials: "include",
          }),

          fetch("/api/sales/summary", {
            credentials: "include",
          }),
        ]);

        const productsData = await productsResponse.json();
        const salesData = await salesResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.error ||
              "No se pudieron cargar los productos"
          );
        }

        if (!salesResponse.ok) {
          throw new Error(
            salesData.error ||
              "No se pudo cargar el resumen de ventas"
          );
        }

        setProducts(productsData);
        setSalesSummary(salesData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /*
   * Indicadores calculados a partir de productos.
   */
  const totalProducts = products.length;

  const outOfStock = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= 5
  ).length;

  /*
   * Indicadores recibidos desde /api/sales/summary.
   */
  const totalSold = Number(
    salesSummary.unidades_vendidas || 0
  );

  const topProducts =
    salesSummary.productos_mas_vendidos || [];

  const recentSales =
    salesSummary.ventas_recientes || [];

  /*
   * Formato sencillo para fecha y hora.
   */
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            Panel de control
          </span>

          <h1>Dashboard</h1>

          <p>
            Resumen general del catálogo y las ventas
          </p>
        </div>
      </div>

      {error && (
        <div className="feedback-message error-message">
          {error}
        </div>
      )}

      {/* ================================
          INDICADORES PRINCIPALES
          ================================ */}

      <div className="dashboard-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-card-top">
            <div className="stat-card-icon">
              <Package size={21} />
            </div>

            <span>Productos</span>
          </div>

          <strong>{totalProducts}</strong>

          <small>Total registrados</small>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-card-top">
            <div className="stat-card-icon">
              <ShoppingCart size={21} />
            </div>

            <span>Unidades vendidas</span>
          </div>

          <strong>{totalSold}</strong>

          <small>Ventas registradas</small>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-card-top">
            <div className="stat-card-icon">
              <AlertTriangle size={21} />
            </div>

            <span>Stock bajo</span>
          </div>

          <strong>{lowStock}</strong>

          <small>5 unidades o menos</small>
        </div>

        <div className="stat-card stat-card-red">
          <div className="stat-card-top">
            <div className="stat-card-icon">
              <Ban size={21} />
            </div>

            <span>Sin stock</span>
          </div>

          <strong>{outOfStock}</strong>

          <small>Productos agotados</small>
        </div>
      </div>

      {/* ================================
          INFORMACIÓN DE VENTAS
          ================================ */}

      <div className="dashboard-details-grid">
        {/* PRODUCTOS MÁS VENDIDOS */}

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <div className="dashboard-panel-title">
                <Trophy size={19} />

                <h2>Productos más vendidos</h2>
              </div>

              <p>
                Productos con mayor cantidad de unidades vendidas
              </p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="dashboard-empty">
              <Trophy size={28} />

              <strong>
                Sin ventas registradas
              </strong>

              <span>
                Los productos más vendidos aparecerán aquí.
              </span>
            </div>
          ) : (
            <div className="top-products-list">
              {topProducts.map((product, index) => (
                <div
                  className="top-product-item"
                  key={product.id}
                >
                  <div className="top-product-position">
                    {index + 1}
                  </div>

                  <div className="top-product-info">
                    <strong>
                      {product.nombre}
                    </strong>

                    <span>
                      Producto #{product.id}
                    </span>
                  </div>

                  <div className="top-product-sales">
                    {product.unidades_vendidas}{" "}
                    {product.unidades_vendidas === 1
                      ? "unidad"
                      : "unidades"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VENTAS RECIENTES */}

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <div className="dashboard-panel-title">
                <Clock size={19} />

                <h2>Ventas recientes</h2>
              </div>

              <p>
                Últimos movimientos registrados
              </p>
            </div>
          </div>

          {recentSales.length === 0 ? (
            <div className="dashboard-empty">
              <Clock size={28} />

              <strong>
                Sin ventas recientes
              </strong>

              <span>
                Cuando registres una venta aparecerá aquí.
              </span>
            </div>
          ) : (
            <div className="recent-sales-list">
              {recentSales.map((sale) => (
                <div
                  className="recent-sale-item"
                  key={sale.id}
                >
                  <div className="recent-sale-icon">
                    <ShoppingCart size={17} />
                  </div>

                  <div className="recent-sale-info">
                    <strong>
                      {sale.producto}
                    </strong>

                    <span>
                      {formatDate(sale.created_at)}
                    </span>
                  </div>

                  <div className="recent-sale-quantity">
                    {sale.cantidad}{" "}
                    {sale.cantidad === 1
                      ? "unidad"
                      : "unidades"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;