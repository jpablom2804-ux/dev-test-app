import { CheckCircle, History, PackageSearch, Trophy } from "lucide-react";

import { productsApi } from "../api/productsApi";
import { salesApi } from "../api/salesApi";
import FeedbackMessage from "../components/FeedbackMessage";
import PageHeader from "../components/PageHeader";
import StockLevel from "../components/StockLevel";
import { useApiData } from "../hooks/useApiData";
import { formatDate, formatPrice, formatToday, formatUnits } from "../utils/format";
import { getInventoryValue, getProductsToRestock } from "../utils/stock";

const INITIAL_DATA = {
  products: [],
  salesSummary: { unidades_vendidas: 0, productos_mas_vendidos: [], ventas_recientes: [] },
};

// Las dos consultas son independientes, así que van en paralelo.
async function loadDashboard() {
  const [products, salesSummary] = await Promise.all([productsApi.list(), salesApi.summary()]);
  return { products, salesSummary };
}

function Dashboard() {
  const { data, loading, error } = useApiData(loadDashboard, INITIAL_DATA);
  const { products, salesSummary } = data;

  if (loading) {
    return <PageHeader meta="Cargando resumen…" title="Dashboard" />;
  }

  const toRestock = getProductsToRestock(products);
  const outOfStock = toRestock.filter((product) => Number(product.stock) === 0).length;
  const lowStock = toRestock.length - outOfStock;

  return (
    <>
      <PageHeader meta={formatToday()} title="Dashboard" />

      {error && <FeedbackMessage type="error">{error}</FeedbackMessage>}

      <dl className="summary-strip">
        <Metric label="Productos activos" value={products.length} />
        <Metric label="Unidades vendidas" value={Number(salesSummary.unidades_vendidas || 0)} />
        <Metric label="Valor del inventario" value={formatPrice(getInventoryValue(products))} />
        <Metric label="Con stock bajo" value={lowStock} tone={lowStock > 0 ? "warning" : null} />
        <Metric label="Agotados" value={outOfStock} tone={outOfStock > 0 ? "danger" : null} />
      </dl>

      <div className="dashboard-grid">
        <RestockPanel products={toRestock} />
        <TopProductsPanel products={salesSummary.productos_mas_vendidos || []} />
      </div>

      <RecentSalesPanel sales={salesSummary.ventas_recientes || []} />
    </>
  );
}

// Una cifra de la franja. Solo se pinta de alerta cuando hay algo que revisar.
function Metric({ label, value, tone }) {
  return (
    <div className={tone ? `summary-strip__item summary-strip__item--${tone}` : "summary-strip__item"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RestockPanel({ products }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <PackageSearch size={16} />
          Necesitan reposición
        </h2>
        <span className="panel__meta">{products.length} productos</span>
      </div>

      {products.length === 0 ? (
        <div className="empty">
          <CheckCircle size={28} />
          <strong>Todo en orden</strong>
          <p>Ningún producto activo está por debajo del mínimo de stock.</p>
        </div>
      ) : (
        <ul className="item-list">
          {products.map((product) => (
            <li key={product.id}>
              <span className="item-list__name">{product.nombre}</span>
              <StockLevel stock={product.stock} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopProductsPanel({ products }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <Trophy size={16} />
          Más vendidos
        </h2>
        <span className="panel__meta">sin contar anuladas</span>
      </div>

      {products.length === 0 ? (
        <div className="empty">
          <Trophy size={28} />
          <strong>Sin ventas todavía</strong>
          <p>El ranking aparece con la primera venta.</p>
        </div>
      ) : (
        <ol className="item-list">
          {products.map((product, index) => (
            <li key={product.id}>
              <span className="item-list__main">
                <span className="item-list__rank">{index + 1}</span>
                <span className="item-list__name">{product.nombre}</span>
              </span>
              <span className="item-list__value">{formatUnits(product.unidades_vendidas)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RecentSalesPanel({ sales }) {
  return (
    <section className="panel panel--table">
      <div className="panel__header">
        <h2 className="panel__title">
          <History size={16} />
          Ventas recientes
        </h2>
        <span className="panel__meta">últimas {sales.length}</span>
      </div>

      {sales.length === 0 ? (
        <div className="empty">
          <History size={28} />
          <strong>Sin ventas recientes</strong>
          <p>Cuando registres una venta, aparece aquí.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="mono data-table__muted">#{sale.id}</td>
                  <td className="data-table__name">
                    <strong>{sale.producto}</strong>
                  </td>
                  <td className="num">{sale.cantidad}</td>
                  <td className="num">{formatPrice(sale.cantidad * sale.precio_unitario)}</td>
                  <td className="mono data-table__muted">{formatDate(sale.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
