import { useState } from "react";
import { AlertTriangle, Boxes, LockKeyhole, LogIn, ReceiptText, User } from "lucide-react";

import { authApi } from "../api/authApi";
import FeedbackMessage from "../components/FeedbackMessage";

const FEATURES = [
  { icon: Boxes, text: "El stock se descuenta en cada venta, sin vender lo que no hay." },
  { icon: ReceiptText, text: "Las ventas anuladas devuelven el stock y quedan en el historial." },
  { icon: LockKeyhole, text: "Sesión protegida y límite de intentos de acceso." },
];

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
    } catch (loginError) {
      // Por ejemplo "Credenciales incorrectas" o el aviso del rate limit.
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <aside className="login__brand">
        <div className="brand">
          <span className="brand__mark">D</span>
          <span>Dev Catalog</span>
        </div>

        <div>
          <h1 className="login__headline">Inventario y ventas en un solo lugar.</h1>
          <p className="login__lead">Registra productos, vende con el stock al día y anula sin perder el historial.</p>

          <ul className="login__facts">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={18} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="login__footer">React · Node.js · MariaDB · Docker</p>
      </aside>

      <main className="login__panel">
        <div className="login__card">
          <div>
            <h2>Iniciar sesión</h2>
            <p>Ingresa con tu usuario y contraseña.</p>
          </div>

          <form className="login__form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label" htmlFor="username">
                Usuario
              </label>
              <div className="input-icon">
                <User size={16} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="input"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Contraseña
              </label>
              <div className="input-icon">
                <LockKeyhole size={16} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <FeedbackMessage type="error" icon={<AlertTriangle size={16} />}>
                {error}
              </FeedbackMessage>
            )}

            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              <LogIn size={16} />
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
