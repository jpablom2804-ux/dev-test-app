// ==================================================
// HOOKS DE REACT
// ==================================================

// useState permite guardar información que cambia
// mientras el componente está funcionando.
//
// En este archivo lo utilizamos para:
// - guardar usuario y contraseña;
// - saber si el login está cargando;
// - guardar mensajes de error.
import { useState } from "react";


// ==================================================
// ICONOS
// ==================================================

// Importamos iconos desde lucide-react
// únicamente para mejorar la interfaz visual.
import {
  LockKeyhole,
  User,
  LogIn,
  AlertTriangle
} from "lucide-react";


// ==================================================
// COMPONENTE LOGIN
// ==================================================
//
// Login recibe una función llamada onLogin
// desde App.jsx.
//
// Cuando el login funciona correctamente:
//
// Login.jsx
// ↓
// recibe usuario del Backend
// ↓
// ejecuta onLogin(data.user)
// ↓
// App.jsx actualiza su estado
// ↓
// aparece la aplicación principal.
//
function Login({ onLogin }) {


  // ==================================================
  // ESTADO DEL FORMULARIO
  // ==================================================

  // Guardamos los valores escritos
  // en los campos del formulario.
  //
  // Estado inicial:
  //
  // username = ""
  // password = ""
  const [form, setForm] = useState({
    username: "",
    password: ""
  });


  // ==================================================
  // ESTADO DE CARGA
  // ==================================================

  // loading indica si actualmente existe
  // una solicitud de login en proceso.
  //
  // false → formulario disponible
  // true  → petición en proceso
  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // ESTADO DE ERROR
  // ==================================================

  // Guarda el mensaje de error que se mostrará
  // al usuario si el login falla.
  //
  // Una cadena vacía significa que
  // actualmente no existe ningún error.
  const [error, setError] =
    useState("");


  // ==================================================
  // ACTUALIZAR CAMPOS DEL FORMULARIO
  // ==================================================
  //
  // Esta función se ejecuta cada vez que
  // el usuario escribe en un input.
  //
  // Utilizamos el atributo "name" del input
  // para saber qué propiedad debemos actualizar.
  //
  // Ejemplo:
  //
  // name="username"
  // value="admin"
  //
  // produce:
  //
  // form.username = "admin"
  //
  const handleChange = (event) => {

    setForm({

      // Conservamos los valores actuales
      // del formulario.
      ...form,

      // Actualizamos únicamente el campo
      // que generó el evento.
      [event.target.name]:
        event.target.value
    });
  };


  // ==================================================
  // ENVIAR FORMULARIO
  // ==================================================
  //
  // Flujo:
  //
  // Usuario envía formulario
  // ↓
  // preventDefault()
  // ↓
  // POST /api/auth/login
  // ↓
  // username + password en JSON
  // ↓
  // Backend:
  // Rate Limiter
  // ↓
  // MariaDB
  // ↓
  // bcrypt
  // ↓
  // JWT
  // ↓
  // cookie HttpOnly
  // ↓
  // respuesta con usuario
  // ↓
  // onLogin(data.user)
  //
  const handleSubmit = async (event) => {

    // Evita que el navegador recargue
    // toda la página al enviar el formulario.
    event.preventDefault();


    // Si ya existe una petición en proceso,
    // evitamos enviar otra.
    if (loading) {
      return;
    }


    try {

      // Indicamos que comenzó
      // el proceso de login.
      setLoading(true);

      // Eliminamos cualquier mensaje
      // de error anterior.
      setError("");


      // ==================================================
      // PETICIÓN AL BACKEND
      // ==================================================

      const response = await fetch(
        "/api/auth/login",
        {

          // Utilizamos POST porque estamos enviando
          // credenciales al servidor.
          method: "POST",


          // Indicamos que el cuerpo de la petición
          // está en formato JSON.
          headers: {
            "Content-Type": "application/json"
          },


          // Permite recibir y enviar cookies.
          //
          // Es importante porque el Backend
          // devuelve el JWT dentro de una cookie
          // HttpOnly llamada auth_token.
          credentials: "include",


          // Convertimos el objeto JavaScript
          // a texto JSON antes de enviarlo.
          body: JSON.stringify({
            username: form.username,
            password: form.password
          })
        }
      );


      // ==================================================
      // LEER RESPUESTA
      // ==================================================

      // Convertimos el JSON recibido
      // desde el Backend a un objeto JavaScript.
      const data =
        await response.json();


      // ==================================================
      // VALIDAR RESPUESTA HTTP
      // ==================================================

      // response.ok es true para respuestas
      // HTTP exitosas como 200.
      //
      // Si recibimos:
      //
      // 400
      // 401
      // 429
      // 500
      //
      // response.ok será false.
      if (!response.ok) {

        // Utilizamos el mensaje enviado
        // por el Backend.
        //
        // Si no existe, mostramos
        // un mensaje genérico.
        throw new Error(
          data.error ||
          "No se pudo iniciar sesión"
        );
      }


      // ==================================================
      // LOGIN CORRECTO
      // ==================================================

      // El Backend devuelve algo similar a:
      //
      // {
      //   message: "Inicio de sesión correcto",
      //   user: {
      //     id: 1,
      //     username: "admin",
      //     role: "admin"
      //   }
      // }
      //
      // Enviamos el usuario hacia App.jsx.
      onLogin(data.user);

    } catch (error) {

      // ==================================================
      // MANEJO DE ERRORES
      // ==================================================

      // Guardamos el mensaje para mostrarlo
      // dentro de la interfaz.
      //
      // Puede ser, por ejemplo:
      //
      // "Credenciales incorrectas"
      //
      // o:
      //
      // "Demasiados intentos de inicio de sesión..."
      setError(error.message);

    } finally {

      // Tanto si el login funciona como si falla,
      // quitamos el estado de carga.
      setLoading(false);
    }
  };


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (

    <div className="login-page">

      <div className="login-card">


        {/* ==================================================
            MARCA DE LA APLICACIÓN
            ================================================== */}

        <div className="login-brand">

          <div className="login-brand-icon">
            D
          </div>

          <div>

            <h1>
              Dev Catalog
            </h1>

            <p>
              Gestión de inventario
            </p>

          </div>

        </div>


        {/* ==================================================
            ENCABEZADO DEL LOGIN
            ================================================== */}

        <div className="login-heading">

          <h2>
            Iniciar sesión
          </h2>

          <p>
            Ingresa tus credenciales para acceder
            al sistema.
          </p>

        </div>


        {/* ==================================================
            FORMULARIO
            ================================================== */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >


          {/* ================================================
              CAMPO USUARIO
              ================================================ */}

          <div className="form-field">

            <label htmlFor="username">
              Usuario
            </label>


            <div className="login-input">

              <User size={18} />


              <input

                // id relaciona el input
                // con su label.
                id="username"

                // name permite que handleChange
                // sepa qué propiedad modificar.
                name="username"

                type="text"

                placeholder="Ingresa tu usuario"

                // El valor viene del estado de React.
                value={form.username}

                // Cada cambio actualiza el estado.
                onChange={handleChange}

                // Ayuda al navegador y gestores
                // de contraseñas a reconocer
                // que este campo es el usuario.
                autoComplete="username"

                // Validación básica del navegador.
                required

                // Mientras se procesa el login
                // no permitimos modificar el campo.
                disabled={loading}
              />

            </div>

          </div>


          {/* ================================================
              CAMPO CONTRASEÑA
              ================================================ */}

          <div className="form-field">

            <label htmlFor="password">
              Contraseña
            </label>


            <div className="login-input">

              <LockKeyhole size={18} />


              <input
                id="password"
                name="password"

                // Oculta visualmente
                // los caracteres escritos.
                type="password"

                placeholder="Ingresa tu contraseña"

                value={form.password}

                onChange={handleChange}

                // Indica que este campo contiene
                // la contraseña actual del usuario.
                autoComplete="current-password"

                required

                disabled={loading}
              />

            </div>

          </div>


          {/* ================================================
              MENSAJE DE ERROR
              ================================================ */}

          {/* Solo mostramos este bloque
              si error contiene algún texto. */}
          {error && (

            <div className="login-error">

              <AlertTriangle size={18} />

              {error}

            </div>

          )}


          {/* ================================================
              BOTÓN LOGIN
              ================================================ */}

          <button
            type="submit"
            className="login-button"

            // Evita múltiples solicitudes mientras
            // el login está procesándose.
            disabled={loading}
          >

            <LogIn size={18} />


            {/* Cambiamos el texto según
                el estado de carga. */}
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}

          </button>

        </form>

      </div>

    </div>
  );
}


// ==================================================
// EXPORTAR COMPONENTE
// ==================================================

export default Login;