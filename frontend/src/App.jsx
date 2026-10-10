// ==================================================
// HOOKS DE REACT
// ==================================================

// useState permite guardar información que puede cambiar
// mientras la aplicación está funcionando.
//
// useEffect permite ejecutar código cuando el componente
// se carga. En este caso se utiliza para comprobar
// si ya existe una sesión iniciada.
import {
  useEffect,
  useState
} from "react";


// ==================================================
// REACT ROUTER
// ==================================================

// Routes agrupa las rutas de la aplicación.
//
// Route relaciona una URL con el componente
// que React debe mostrar.
import {
  Routes,
  Route
} from "react-router-dom";


// ==================================================
// COMPONENTES Y PÁGINAS
// ==================================================

// Barra lateral de navegación.
import Sidebar from "./components/Sidebar";

// Página principal con métricas y resumen.
import Dashboard from "./pages/Dashboard";

// Página para administrar productos.
import Products from "./pages/Products";

// Página para registrar y consultar ventas.
import Sales from "./pages/Sales";

// Página de inicio de sesión.
import Login from "./pages/Login";


// ==================================================
// ESTILOS
// ==================================================

// Archivo principal de estilos de la aplicación.
import "./App.css";


// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================
//
// App es el componente principal del Frontend.
//
// Se encarga de:
//
// 1. Comprobar si existe una sesión.
// 2. Mostrar Login si no hay usuario autenticado.
// 3. Mostrar la aplicación si hay una sesión.
// 4. Manejar el cierre de sesión.
// 5. Definir las rutas principales.
//
function App() {


  // ==================================================
  // ESTADO DEL USUARIO
  // ==================================================

  // Guarda la información del usuario autenticado.
  //
  // Ejemplo:
  //
  // {
  //   id: 1,
  //   username: "admin",
  //   role: "admin"
  // }
  //
  // Si vale null significa que no existe
  // un usuario autenticado.
  const [user, setUser] =
    useState(null);


  // ==================================================
  // ESTADO DE COMPROBACIÓN DE SESIÓN
  // ==================================================

  // Indica si todavía estamos consultando al Backend
  // para saber si existe una sesión válida.
  //
  // true  → todavía se está comprobando.
  // false → la comprobación ya terminó.
  const [
    checkingSession,
    setCheckingSession
  ] = useState(true);


  // ==================================================
  // ESTADO DEL LOGOUT
  // ==================================================

  // Indica si actualmente se está procesando
  // una solicitud de cierre de sesión.
  //
  // Esto ayuda a evitar múltiples solicitudes
  // de logout al mismo tiempo.
  const [
    loggingOut,
    setLoggingOut
  ] = useState(false);


  // ==================================================
  // COMPROBAR SESIÓN
  // ==================================================
  //
  // Este useEffect se ejecuta cuando App se carga.
  //
  // Flujo:
  //
  // App inicia
  // ↓
  // GET /api/auth/me
  // ↓
  // Backend verifica la cookie JWT
  // ↓
  // ¿Token válido?
  //
  // SÍ → guardar usuario
  // NO  → user = null
  //
  useEffect(() => {

    // Creamos una función async dentro del useEffect
    // para poder utilizar await.
    const checkSession = async () => {

      try {

        // Consultamos al Backend para saber
        // si la sesión actual sigue siendo válida.
        const response = await fetch(
          "/api/auth/me",
          {
            // Incluye las cookies en la petición.
            //
            // Esto es necesario porque el JWT
            // se encuentra dentro de una cookie HttpOnly.
            credentials: "include"
          }
        );


        // Si el Backend devuelve un error,
        // por ejemplo HTTP 401,
        // consideramos que no existe sesión válida.
        if (!response.ok) {

          setUser(null);

          return;
        }


        // Convertimos la respuesta JSON
        // a un objeto JavaScript.
        const data =
          await response.json();


        // Guardamos el usuario recibido.
        //
        // React volverá a renderizar App
        // con la información del usuario.
        setUser(data.user);

      } catch (error) {

        // Si ocurre un problema de comunicación
        // con el Backend, registramos el error.
        console.error(
          "Error comprobando sesión:",
          error
        );

        // Si no podemos comprobar la sesión,
        // tratamos al usuario como no autenticado.
        setUser(null);

      } finally {

        // finally se ejecuta tanto si la petición
        // funcionó como si ocurrió un error.
        //
        // Indicamos que la comprobación terminó.
        setCheckingSession(false);
      }
    };


    // Ejecutamos la comprobación de sesión.
    checkSession();

    // El array vacío [] indica que este efecto
    // debe ejecutarse cuando App se monta inicialmente.
  }, []);


  // ==================================================
  // CERRAR SESIÓN
  // ==================================================
  //
  // Flujo:
  //
  // Usuario pulsa "Cerrar sesión"
  // ↓
  // POST /api/auth/logout
  // ↓
  // Backend elimina cookie auth_token
  // ↓
  // setUser(null)
  // ↓
  // React muestra Login
  //
  const handleLogout = async () => {

    // Si ya existe un logout en proceso,
    // evitamos ejecutar otro.
    if (loggingOut) {
      return;
    }


    try {

      // Indicamos que empezó el proceso
      // de cierre de sesión.
      setLoggingOut(true);


      // Solicitamos al Backend cerrar la sesión.
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",

          // Incluimos la cookie de autenticación.
          credentials: "include"
        }
      );


      // Si el Backend no responde correctamente,
      // generamos un error.
      if (!response.ok) {
        throw new Error(
          "No se pudo cerrar la sesión"
        );
      }


      // El Backend eliminó la cookie.
      //
      // También eliminamos el usuario
      // del estado de React.
      setUser(null);

    } catch (error) {

      // Registramos cualquier problema
      // ocurrido durante el logout.
      console.error(
        "Error cerrando sesión:",
        error
      );

    } finally {

      // Finalizamos el estado de carga
      // del cierre de sesión.
      setLoggingOut(false);
    }
  };


  // ==================================================
  // CARGANDO SESIÓN
  // ==================================================

  // Mientras todavía estamos consultando
  // /api/auth/me mostramos una pantalla de carga.
  //
  // Esto evita mostrar Login momentáneamente
  // antes de saber si realmente existe una sesión.
  if (checkingSession) {

    return (
      <div className="session-loading">

        <div
          className="session-loader"
        />

        <p>
          Comprobando sesión...
        </p>

      </div>
    );
  }


  // ==================================================
  // USUARIO NO AUTENTICADO
  // ==================================================

  // Si user es null, mostramos únicamente Login.
  //
  // Dashboard, Products y Sales
  // todavía no se renderizan.
  if (!user) {

    return (
      <Login

        // Login recibe esta función mediante props.
        //
        // Cuando el login funciona correctamente,
        // Login.jsx devuelve el usuario autenticado
        // y lo guardamos en el estado de App.
        onLogin={
          (authenticatedUser) =>
            setUser(authenticatedUser)
        }

      />
    );
  }


  // ==================================================
  // APLICACIÓN AUTENTICADA
  // ==================================================
  //
  // Si llegamos hasta aquí significa:
  //
  // checkingSession = false
  // user != null
  //
  // Por lo tanto podemos mostrar
  // la aplicación principal.
  return (

    <div className="app-layout">


      {/* ==================================================
          SIDEBAR
          ================================================== */}

      <Sidebar

        // Usuario autenticado que será mostrado
        // en la barra lateral.
        user={user}

        // Función que se ejecutará cuando
        // el usuario pulse cerrar sesión.
        onLogout={handleLogout}

        // Permite al Sidebar saber si actualmente
        // se está procesando el logout.
        loggingOut={loggingOut}

      />


      {/* ==================================================
          CONTENIDO PRINCIPAL
          ================================================== */}

      <main className="main-content">


        {/* ==================================================
            RUTAS DE LA APLICACIÓN
            ==================================================

            React Router revisa la URL actual
            y decide qué página debe mostrar.

            /
            → Dashboard

            /products
            → Products

            /sales
            → Sales
        */}

        <Routes>


          {/* ==============================
              DASHBOARD
              ============================== */}

          <Route
            path="/"
            element={<Dashboard />}
          />


          {/* ==============================
              PRODUCTOS
              ============================== */}

          <Route
            path="/products"
            element={<Products />}
          />


          {/* ==============================
              VENTAS
              ============================== */}

          <Route
            path="/sales"
            element={<Sales />}
          />


        </Routes>

      </main>

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

// Exportamos App para utilizarlo
// como componente principal de la aplicación.
export default App;