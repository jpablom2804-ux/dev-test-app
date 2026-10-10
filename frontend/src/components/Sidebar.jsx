// ==================================================
// REACT ROUTER
// ==================================================

// NavLink permite crear enlaces de navegación
// que saben si su ruta está actualmente activa.
//
// Esto nos permite aplicar una clase diferente
// al enlace seleccionado.
import {
  NavLink
} from "react-router-dom";


// ==================================================
// ICONOS
// ==================================================

// LogOut:
// icono del botón para cerrar sesión.
//
// ShoppingCart:
// icono utilizado en la sección de ventas.
import {
  LogOut,
  ShoppingCart
} from "lucide-react";


// ==================================================
// COMPONENTE SIDEBAR
// ==================================================
//
// Sidebar recibe tres props desde App.jsx:
//
// user
// → información del usuario autenticado.
//
// onLogout
// → función que App.jsx utiliza para cerrar sesión.
//
// loggingOut
// → indica si actualmente se está procesando
//   el cierre de sesión.
//
function Sidebar({
  user,
  onLogout,
  loggingOut
}) {


  // ==================================================
  // INICIAL DEL USUARIO
  // ==================================================

  // Obtenemos la primera letra del username
  // para mostrarla en el avatar.
  //
  // Ejemplo:
  //
  // username = "admin"
  //
  // ↓
  //
  // initial = "A"
  //
  // Si no existe username utilizamos "U".
  const initial =
    user?.username
      ?.charAt(0)
      .toUpperCase() || "U";


  // ==================================================
  // INTERFAZ DEL SIDEBAR
  // ==================================================

  return (

    <aside className="sidebar">


      {/* ==================================================
          PARTE SUPERIOR
          ================================================== */}

      <div>


        {/* ==================================================
            MARCA DE LA APLICACIÓN
            ================================================== */}

        <div className="brand">


          {/* Icono / logotipo */}
          <div className="brand-icon">
            D
          </div>


          {/* Nombre de la aplicación */}
          <div>

            <h5>
              Dev Catalog
            </h5>

            <small>
              Administration
            </small>

          </div>

        </div>


        {/* ==================================================
            NAVEGACIÓN
            ================================================== */}

        <nav className="sidebar-nav">


          {/* ================================================
              DASHBOARD
              ================================================ */}

          <NavLink

            // Ruta principal.
            to="/"

            // "end" es importante para la ruta "/".
            //
            // Sin end, "/" podría considerarse activa
            // también cuando estamos en:
            //
            // /products
            // /sales
            //
            // Con end solamente queda activa
            // cuando la URL es exactamente "/".
            end

            // NavLink proporciona isActive.
            //
            // Si la ruta actual coincide,
            // aplicamos también la clase "active".
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >

            Dashboard

          </NavLink>


          {/* ================================================
              PRODUCTOS
              ================================================ */}

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


          {/* ================================================
              VENTAS
              ================================================ */}

          <NavLink
            to="/sales"

            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >

            <ShoppingCart size={17} />

            Ventas

          </NavLink>

        </nav>

      </div>


      {/* ==================================================
          PARTE INFERIOR
          ================================================== */}

      <div className="sidebar-footer">


        {/* ==================================================
            INFORMACIÓN DEL USUARIO
            ================================================== */}

        <div className="sidebar-user">


          {/* ================================================
              AVATAR
              ================================================ */}

          <div className="sidebar-user-avatar">

            {initial}

          </div>


          {/* ================================================
              DATOS DEL USUARIO
              ================================================ */}

          <div className="sidebar-user-info">


            {/* Username */}
            <strong>

              {user?.username || "Usuario"}

            </strong>


            {/* Rol */}
            <span>

              {/* Si el rol es "admin",
                  mostramos una versión más amigable
                  para el usuario. */}
              {user?.role === "admin"
                ? "Administrador"
                : user?.role}

            </span>

          </div>

        </div>


        {/* ==================================================
            CERRAR SESIÓN
            ================================================== */}

        <button
          type="button"

          className="logout-button"

          // Ejecuta handleLogout de App.jsx.
          onClick={onLogout}

          // Mientras se procesa el logout
          // deshabilitamos el botón.
          disabled={loggingOut}
        >

          <LogOut size={17} />


          {/* El texto cambia según
              el estado del logout. */}
          {loggingOut
            ? "Cerrando..."
            : "Cerrar sesión"}

        </button>

      </div>

    </aside>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Sidebar;