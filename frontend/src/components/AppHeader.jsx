import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart } from "lucide-react";

import UserMenu from "./UserMenu";

// `end` en "/" evita que Dashboard quede marcado en las demás rutas.
const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/sales", label: "Ventas", icon: ShoppingCart },
];

function AppHeader({ user, onLogout, loggingOut }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="brand" aria-label="Dev Catalog: ir al Dashboard">
          <span className="brand__mark">D</span>
          <span className="brand__name">Dev Catalog</span>
        </Link>

        <nav className="app-nav" aria-label="Navegación principal">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="app-nav__link" title={label}>
              <Icon size={16} />
              <span className="app-nav__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <UserMenu user={user} onLogout={onLogout} loggingOut={loggingOut} />
      </div>
    </header>
  );
}

export default AppHeader;
