import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

function Sidebar({
  user,
  onLogout,
  loggingOut
}) {
  const initial =
    user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <aside className="sidebar">

      <div>
        <div className="brand">
          <div className="brand-icon">D</div>

          <div>
            <h5>Dev Catalog</h5>
            <small>Administration</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Productos
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">

        <div className="sidebar-user">

          <div className="sidebar-user-avatar">
            {initial}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user?.username || "Usuario"}
            </strong>

            <span>
              {user?.role === "admin"
                ? "Administrador"
                : user?.role}
            </span>
          </div>

        </div>

        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
          disabled={loggingOut}
        >
          <LogOut size={17} />

          {loggingOut
            ? "Cerrando..."
            : "Cerrar sesión"}
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;