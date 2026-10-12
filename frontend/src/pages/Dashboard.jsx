import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Clock, Package, ShoppingCart, Trophy } from "lucide-react";

import { productsApi } from "../api/productsApi";
import { salesApi } from "../api/salesApi";
import { LOW_STOCK_LIMIT } from "../utils/stock";
import { formatDate, formatUnits } from "../utils/format";

const EMPTY_SUMMARY = {
  unidades_vendidas: 0,
  productos_mas_vendidos: [],
  ventas_recientes: [],
};

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [salesSummary, setSalesSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Las dos consultas son independientes, así que van en paralelo.
    Promise.all([productsApi.list(), salesApi.summary()])
      .then(([productsData, summaryData]) => {
        setProducts(productsData);
        setSalesSummary(summaryData);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const outOfStock = products.filter((product) => Number(product.stock) === 0).length;
  const lowStock = products.filter(
    (product) => Number(product.stock) > 0 && Number(product.stock) <= LOW_STOCK_LIMIT
  ).length;

  const totalSold = Number(salesSummary.unidades_vendidas || 0);
  const topProducts = salesSummary.productos_mas_vendidos || [];
  const recentSales = salesSummary.ventas_recientes || [];

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
          <span className="page-eyebrow">Panel de control</span>
          <h1>Dashboard</h1>
          <p>Resumen general del catálogo y las ventas</p>
        </div>
      </div>

      {error && <div className="feedback-message error-message">{error}</div>}

      <div className="dashboard-grid">
        <StatCard color="blue" icon={<Package size={21} />} label="Productos" value={totalProducts} hint="Total registrados" />
        <StatCard color="purple" icon={<ShoppingCart size={21} />} label="Unidades vendidas" value={totalSold} hint="Ventas registradas" />
        <StatCard color="orange" icon={<AlertTriangle size={21} />} label="Stock bajo" value={lowStock} hint={`${LOW_STOCK_LIMIT} unidades o menos`} />
        <StatCard color="red" icon={<Ban size={21} />} label="Sin stock" value={outOfStock} hint="Productos agotados" />
      </div>

      <div className="dashboard-details-grid">
        <DashboardPanel
          icon={<Trophy size={19} />}
          title="Productos más vendidos"
          description="Productos con mayor cantidad de unidades vendidas"
        >
          {topProducts.length === 0 ? (
            <EmptyPanel
              icon={<Trophy size={28} />}
              title="Sin ventas registradas"
              text="Los productos más vendidos aparecerán aquí."
            />
          ) : (
            <div className="top-products-list">
              {topProducts.map((product, index) => (
                <div className="top-product-item" key={product.id}>
                  <div className="top-product-position">{index + 1}</div>
                  <div className="top-product-info">
                    <strong>{product.nombre}</strong>
                    <span>Producto #{product.id}</span>
                  </div>
                  <div className="top-product-sales">{formatUnits(product.unidades_vendidas)}</div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel icon={<Clock size={19} />} title="Ventas recientes" description="Últimos movimientos registrados">
          {recentSales.length === 0 ? (
            <EmptyPanel
              icon={<Clock size={28} />}
              title="Sin ventas recientes"
              text="Cuando registres una venta aparecerá aquí."
            />
          ) : (
            <div className="recent-sales-list">
              {recentSales.map((sale) => (
                <div className="recent-sale-item" key={sale.id}>
                  <div className="recent-sale-icon">
                    <ShoppingCart size={17} />
                  </div>
                  <div className="recent-sale-info">
                    <strong>{sale.producto}</strong>
                    <span>{formatDate(sale.created_at)}</span>
                  </div>
                  <div className="recent-sale-quantity">{formatUnits(sale.cantidad)}</div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

function StatCard({ color, icon, label, value, hint }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function DashboardPanel({ icon, title, description, children }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <div className="dashboard-panel-title">
            {icon}
            <h2>{title}</h2>
          </div>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({ icon, title, text }) {
  return (
    <div className="dashboard-empty">
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export default Dashboard;
