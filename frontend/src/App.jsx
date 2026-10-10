import {
  useEffect,
  useState
} from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Login from "./pages/Login";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ==================================================
  // COMPROBAR SESIÓN
  // ==================================================

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            credentials: "include"
          }
        );

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        setUser(data.user);

      } catch (error) {
        console.error(
          "Error comprobando sesión:",
          error
        );

        setUser(null);

      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo cerrar la sesión"
        );
      }

      setUser(null);

    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );

    } finally {
      setLoggingOut(false);
    }
  };

  // ==================================================
  // CARGANDO SESIÓN
  // ==================================================

  if (checkingSession) {
    return (
      <div className="session-loading">
        <div className="session-loader" />

        <p>Comprobando sesión...</p>
      </div>
    );
  }

  // ==================================================
  // SIN AUTENTICACIÓN
  // ==================================================

  if (!user) {
    return (
      <Login
        onLogin={(authenticatedUser) =>
          setUser(authenticatedUser)
        }
      />
    );
  }

  // ==================================================
  // APLICACIÓN AUTENTICADA
  // ==================================================

  return (
    <div className="app-layout">

      <Sidebar
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <main className="main-content">

        <Routes>

  <Route
    path="/"
    element={<Dashboard />}
  />

  <Route
    path="/products"
    element={<Products />}
  />

  <Route
    path="/sales"
    element={<Sales />}
  />

</Routes>

      </main>

    </div>
  );
}

export default App;