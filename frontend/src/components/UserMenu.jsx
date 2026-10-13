import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

const ROLE_LABELS = { admin: "Administrador" };

function UserMenu({ user, onLogout, loggingOut }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  // Mientras está abierto, se cierra con un clic afuera o con Escape.
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="avatar">{initial}</span>
        <span className="user-menu__name">{user?.username}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__info">
            <strong>{user?.username}</strong>
            <span>{ROLE_LABELS[user?.role] ?? user?.role}</span>
          </div>

          <button type="button" role="menuitem" className="user-menu__item" onClick={onLogout} disabled={loggingOut}>
            <LogOut size={16} />
            {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
