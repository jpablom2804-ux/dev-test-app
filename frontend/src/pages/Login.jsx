import { useState } from "react";
import { AlertTriangle, LockKeyhole, LogIn, User } from "lucide-react";

import { authApi } from "../api/authApi";

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await authApi.login(form);
      onLogin(data.user);
    } catch (error) {
      // Por ejemplo "Credenciales incorrectas" o el aviso del rate limit.
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">D</div>

          <div>
            <h1>Dev Catalog</h1>
            <p>Gestión de inventario</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Iniciar sesión</h2>
          <p>Ingresa tus credenciales para acceder al sistema.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">Usuario</label>

            <div className="login-input">
              <User size={18} />
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="password">Contraseña</label>

            <div className="login-input">
              <LockKeyhole size={18} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
