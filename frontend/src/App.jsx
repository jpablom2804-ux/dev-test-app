import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import { authApi } from "./api/authApi";
import { onUnauthorized } from "./api/client";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Si una ruta protegida responde 401 (por ejemplo, el JWT expiró
    // con la aplicación abierta), se vuelve a la pantalla de login.
    onUnauthorized(() => setUser(null));

    // El JWT está en una cookie HttpOnly que JavaScript no puede leer:
    // solo el Backend puede decir si la sesión sigue siendo válida.
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Evita mostrar el login un instante antes de saber si ya hay sesión.
  if (checkingSession) {
    return (
      <div className="session-loading">
        <div className="session-loader" />
        <p>Comprobando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} loggingOut={loggingOut} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
