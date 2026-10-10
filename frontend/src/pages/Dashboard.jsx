// ==================================================
// HOOKS DE REACT
// ==================================================

// useState permite guardar información que puede cambiar.
//
// useEffect permite ejecutar código cuando
// el componente se carga.
import {
  useEffect,
  useState
} from "react";


// ==================================================
// ICONOS
// ==================================================

// Estos iconos se utilizan únicamente
// para mejorar la presentación visual
// de los indicadores y paneles.
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Ban,
  Trophy,
  Clock,
} from "lucide-react";


// ==================================================
// COMPONENTE DASHBOARD
// ==================================================
//
// El Dashboard muestra un resumen general
// del sistema.
//
// Obtiene información desde dos endpoints:
//
// GET /api/products
// GET /api/sales/summary
//
// Con esos datos muestra:
//
// - total de productos;
// - unidades vendidas;
// - productos con stock bajo;
// - productos sin stock;
// - productos más vendidos;
// - ventas recientes.
//
function Dashboard() {


  // ==================================================
  // ESTADO DE PRODUCTOS
  // ==================================================

  // Guarda los productos activos obtenidos
  // desde GET /api/products.
  const [
    products,
    setProducts
  ] = useState([]);


  // ==================================================
  // ESTADO DEL RESUMEN DE VENTAS
  // ==================================================

  // Guarda las estadísticas obtenidas
  // desde GET /api/sales/summary.
  //
  // Definimos valores iniciales para evitar
  // trabajar con undefined mientras carga la API.
  const [
    salesSummary,
    setSalesSummary
  ] = useState({
    unidades_vendidas: 0,
    productos_mas_vendidos: [],
    ventas_recientes: [],
  });


  // ==================================================
  // ESTADO DE CARGA
  // ==================================================

  // true mientras se consultan los datos.
  const [
    loading,
    setLoading
  ] = useState(true);


  // ==================================================
  // ESTADO DE ERROR
  // ==================================================

  // Guarda cualquier mensaje de error
  // producido al cargar el Dashboard.
  const [
    error,
    setError
  ] = useState("");


  // ==================================================
  // CARGAR INFORMACIÓN DEL DASHBOARD
  // ==================================================
  //
  // Este efecto se ejecuta cuando Dashboard
  // se monta por primera vez.
  //
  // Flujo:
  //
  // Dashboard carga
  // ↓
  // Promise.all()
  // ↓
  // ├── GET /api/products
  // └── GET /api/sales/summary
  // ↓
  // ambas respuestas
  // ↓
  // actualizar estados
  //
  useEffect(() => {

    const loadDashboard = async () => {

      try {

        // ==================================================
        // REALIZAR PETICIONES EN PARALELO
        // ==================================================

        // Promise.all permite ejecutar ambas peticiones
        // al mismo tiempo.
        //
        // Sin Promise.all:
        //
        // pedir productos
        // ↓
        // esperar
        // ↓
        // pedir ventas
        //
        // Con Promise.all:
        //
        // productos ─────┐
        //                ├── al mismo tiempo
        // ventas ────────┘
        const [
          productsResponse,
          salesResponse
        ] = await Promise.all([

          // Obtener productos activos.
          fetch(
            "/api/products",
            {
              // Incluye la cookie JWT.
              credentials: "include",
            }
          ),

          // Obtener estadísticas de ventas.
          fetch(
            "/api/sales/summary",
            {
              // Incluye la cookie JWT.
              credentials: "include",
            }
          ),
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

        // Si el Backend respondió con un código
        // no exitoso, generamos un error.
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
            "No se pudo cargar el resumen de ventas"
          );
        }


        // ==================================================
        // GUARDAR DATOS
        // ==================================================

        // Guardamos los productos recibidos.
        setProducts(productsData);

        // Guardamos el resumen de ventas.
        setSalesSummary(salesData);

      } catch (error) {

        // Si alguna petición falla,
        // mostramos el mensaje al usuario.
        setError(error.message);

      } finally {

        // La carga termina tanto si
        // las peticiones funcionan como si fallan.
        setLoading(false);
      }
    };


    // Ejecutamos la carga.
    loadDashboard();

    // [] indica que este efecto se ejecuta
    // cuando el componente se monta inicialmente.
  }, []);


  // ==================================================
  // INDICADORES CALCULADOS DESDE PRODUCTOS
  // ==================================================


  // --------------------------------------------------
  // TOTAL DE PRODUCTOS
  // --------------------------------------------------

  // products contiene únicamente productos activos,
  // por lo que su longitud representa
  // cuántos productos activos existen.
  const totalProducts =
    products.length;


  // --------------------------------------------------
  // PRODUCTOS SIN STOCK
  // --------------------------------------------------

  // filter() crea una lista únicamente
  // con productos cuyo stock sea exactamente 0.
  //
  // Después usamos .length para saber
  // cuántos productos cumplen esa condición.
  const outOfStock =
    products.filter(
      (product) =>
        Number(product.stock) === 0
    ).length;


  // --------------------------------------------------
  // PRODUCTOS CON STOCK BAJO
  // --------------------------------------------------

  // Consideramos stock bajo cuando:
  //
  // stock > 0
  // y
  // stock <= 5
  //
  // Un producto con stock 0 se cuenta
  // por separado como "Sin stock".
  const lowStock =
    products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= 5
    ).length;


  // ==================================================
  // INDICADORES RECIBIDOS DESDE VENTAS
  // ==================================================


  // --------------------------------------------------
  // TOTAL DE UNIDADES VENDIDAS
  // --------------------------------------------------

  // Este valor ya fue calculado en el Backend
  // mediante SUM(cantidad).
  //
  // Lo convertimos a Number para trabajar
  // siempre con un valor numérico.
  const totalSold =
    Number(
      salesSummary.unidades_vendidas || 0
    );


  // --------------------------------------------------
  // PRODUCTOS MÁS VENDIDOS
  // --------------------------------------------------

  // Lista con los productos que han vendido
  // mayor cantidad de unidades.
  const topProducts =
    salesSummary.productos_mas_vendidos || [];


  // --------------------------------------------------
  // VENTAS RECIENTES
  // --------------------------------------------------

  // Lista con las últimas ventas
  // registradas en el sistema.
  const recentSales =
    salesSummary.ventas_recientes || [];


  // ==================================================
  // FORMATEAR FECHAS
  // ==================================================
  //
  // MariaDB devuelve la fecha de creación
  // de cada venta.
  //
  // Esta función transforma esa fecha
  // a un formato fácil de leer.
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


    // Utilizamos formato regional
    // de Costa Rica.
    return new Date(date).toLocaleString(
      "es-CR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // ==================================================
  // PANTALLA DE CARGA
  // ==================================================

  // Mientras esperamos las respuestas del Backend,
  // mostramos un mensaje de carga.
  if (loading) {

    return (
      <div className="page-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Cargando información...
          </p>

        </div>

      </div>
    );
  }


  // ==================================================
  // INTERFAZ DEL DASHBOARD
  // ==================================================

  return (

    <div className="dashboard-page">


      {/* ==================================================
          ENCABEZADO
          ================================================== */}

      <div className="page-header">

        <div>

          <span className="page-eyebrow">
            Panel de control
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Resumen general del catálogo y las ventas
          </p>

        </div>

      </div>


      {/* ==================================================
          MENSAJE DE ERROR
          ================================================== */}

      {/* Si existe un error,
          mostramos el mensaje recibido. */}
      {error && (

        <div className="feedback-message error-message">
          {error}
        </div>

      )}


      {/* ==================================================
          INDICADORES PRINCIPALES
          ================================================== */}

      <div className="dashboard-grid">


        {/* ================================================
            TOTAL DE PRODUCTOS
            ================================================ */}

        <div className="stat-card stat-card-blue">

          <div className="stat-card-top">

            <div className="stat-card-icon">
              <Package size={21} />
            </div>

            <span>
              Productos
            </span>

          </div>

          <strong>
            {totalProducts}
          </strong>

          <small>
            Total registrados
          </small>

        </div>


        {/* ================================================
            UNIDADES VENDIDAS
            ================================================ */}

        <div className="stat-card stat-card-purple">

          <div className="stat-card-top">

            <div className="stat-card-icon">
              <ShoppingCart size={21} />
            </div>

            <span>
              Unidades vendidas
            </span>

          </div>

          <strong>
            {totalSold}
          </strong>

          <small>
            Ventas registradas
          </small>

        </div>


        {/* ================================================
            STOCK BAJO
            ================================================ */}

        <div className="stat-card stat-card-orange">

          <div className="stat-card-top">

            <div className="stat-card-icon">
              <AlertTriangle size={21} />
            </div>

            <span>
              Stock bajo
            </span>

          </div>

          <strong>
            {lowStock}
          </strong>

          <small>
            5 unidades o menos
          </small>

        </div>


        {/* ================================================
            SIN STOCK
            ================================================ */}

        <div className="stat-card stat-card-red">

          <div className="stat-card-top">

            <div className="stat-card-icon">
              <Ban size={21} />
            </div>

            <span>
              Sin stock
            </span>

          </div>

          <strong>
            {outOfStock}
          </strong>

          <small>
            Productos agotados
          </small>

        </div>

      </div>


      {/* ==================================================
          INFORMACIÓN DETALLADA DE VENTAS
          ================================================== */}

      <div className="dashboard-details-grid">


        {/* ==================================================
            PRODUCTOS MÁS VENDIDOS
            ================================================== */}

        <section className="dashboard-panel">


          {/* Encabezado del panel */}
          <div className="dashboard-panel-header">

            <div>

              <div className="dashboard-panel-title">

                <Trophy size={19} />

                <h2>
                  Productos más vendidos
                </h2>

              </div>

              <p>
                Productos con mayor cantidad de unidades vendidas
              </p>

            </div>

          </div>


          {/* ==================================================
              SIN VENTAS
              ================================================== */}

          {/* Operador ternario:

              condición
              ? mostrar esto
              : mostrar aquello
          */}

          {topProducts.length === 0 ? (

            // Si no existen ventas,
            // mostramos un estado vacío.
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

            // Si existen ventas,
            // mostramos el ranking.
            <div className="top-products-list">


              {/* map() recorre cada producto
                  y genera un elemento visual. */}
              {topProducts.map(
                (product, index) => (

                  <div
                    className="top-product-item"

                    // React necesita una key única
                    // para identificar cada elemento.
                    key={product.id}
                  >


                    {/* Posición dentro del ranking */}
                    <div className="top-product-position">
                      {index + 1}
                    </div>


                    {/* Información del producto */}
                    <div className="top-product-info">

                      <strong>
                        {product.nombre}
                      </strong>

                      <span>
                        Producto #{product.id}
                      </span>

                    </div>


                    {/* Unidades vendidas */}
                    <div className="top-product-sales">

                      {product.unidades_vendidas}{" "}

                      {/* Cambiamos singular/plural
                          según la cantidad. */}
                      {product.unidades_vendidas === 1
                        ? "unidad"
                        : "unidades"}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ==================================================
            VENTAS RECIENTES
            ================================================== */}

        <section className="dashboard-panel">


          {/* Encabezado del panel */}
          <div className="dashboard-panel-header">

            <div>

              <div className="dashboard-panel-title">

                <Clock size={19} />

                <h2>
                  Ventas recientes
                </h2>

              </div>

              <p>
                Últimos movimientos registrados
              </p>

            </div>

          </div>


          {/* ==================================================
              LISTADO DE VENTAS
              ================================================== */}

          {recentSales.length === 0 ? (

            // Si todavía no existen ventas.
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

            // Si existen ventas,
            // recorremos la lista con map().
            <div className="recent-sales-list">


              {recentSales.map(
                (sale) => (

                  <div
                    className="recent-sale-item"

                    // Cada venta tiene un ID único.
                    key={sale.id}
                  >


                    {/* Icono visual */}
                    <div className="recent-sale-icon">

                      <ShoppingCart size={17} />

                    </div>


                    {/* Nombre y fecha */}
                    <div className="recent-sale-info">

                      <strong>
                        {sale.producto}
                      </strong>

                      <span>
                        {formatDate(
                          sale.created_at
                        )}
                      </span>

                    </div>


                    {/* Cantidad vendida */}
                    <div className="recent-sale-quantity">

                      {sale.cantidad}{" "}

                      {sale.cantidad === 1
                        ? "unidad"
                        : "unidades"}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Dashboard;