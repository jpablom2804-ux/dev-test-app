import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, ShoppingCart } from "lucide-react";

// `end` en "/" evita que Dashboard quede marcado en las demás rutas.
const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/sales", label: "Ventas", icon: ShoppingCart },
];

const ROLE_LABELS = { admin: "Administrador" };

function Sidebar({ user, onLogout, loggingOut }) {
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-icon">D</div>
          <div>
            <h5>Dev Catalog</h5>
            <small>Administración</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initial}</div>
          <div className="sidebar-user-info">
            <strong>{user?.username || "Usuario"}</strong>
            <span>{ROLE_LABELS[user?.role] ?? user?.role}</span>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={onLogout} disabled={loggingOut}>
          <LogOut size={17} />
          {loggingOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
