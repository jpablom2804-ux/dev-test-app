import { useEffect, useState } from "react";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
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
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= 5
  ).length;

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
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general del catálogo</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="stat-card">
          <span>Productos</span>
          <strong>{totalProducts}</strong>
          <small>Total registrados</small>
        </div>

        <div className="stat-card">
          <span>Stock total</span>
          <strong>{totalStock}</strong>
          <small>Unidades disponibles</small>
        </div>

        <div className="stat-card">
          <span>Sin stock</span>
          <strong>{outOfStock}</strong>
          <small>Productos agotados</small>
        </div>

        <div className="stat-card">
          <span>Stock bajo</span>
          <strong>{lowStock}</strong>
          <small>5 unidades o menos</small>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;