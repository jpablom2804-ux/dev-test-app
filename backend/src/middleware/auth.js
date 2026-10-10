// ==================================================
// DEPENDENCIA JWT
// ==================================================

// Importamos jsonwebtoken.
// Esta librería permite firmar y verificar tokens JWT.
const jwt = require("jsonwebtoken");


// ==================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==================================================
//
// Este middleware se ejecuta antes de una ruta protegida.
//
// Flujo:
//
// Request
// ↓
// Buscar cookie auth_token
// ↓
// ¿Existe?
// ├── NO → 401 No autenticado
// └── SÍ
//      ↓
//   jwt.verify()
//      ↓
// ¿Es válido?
// ├── NO → 401 Token inválido o expirado
// └── SÍ
//      ↓
// guardar usuario en req.user
//      ↓
// next()
//      ↓
// continuar hacia la ruta solicitada
//
function authenticateToken(req, res, next) {

  // Obtenemos el JWT desde la cookie llamada auth_token.
  //
  // cookie-parser convierte las cookies recibidas
  // por el navegador en el objeto req.cookies.
  //
  // El operador ?. evita un error si req.cookies
  // no existe.
  const token = req.cookies?.auth_token;


  // ==================================================
  // VALIDAR QUE EXISTA EL TOKEN
  // ==================================================

  // Si no existe auth_token significa que el usuario
  // no tiene una sesión autenticada válida.
  if (!token) {
    return res.status(401).json({
      error: "No autenticado"
    });
  }


  // ==================================================
  // VERIFICAR JWT
  // ==================================================

  try {

    // jwt.verify() comprueba que:
    //
    // 1. El token tenga una firma válida.
    // 2. No haya sido modificado.
    // 3. No haya expirado.
    //
    // JWT_SECRET debe ser el mismo secreto utilizado
    // cuando el token fue creado durante el login.
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // ==================================================
    // GUARDAR INFORMACIÓN DEL USUARIO
    // ==================================================

    // decoded contiene el payload que fue incluido
    // cuando se creó el JWT.
    //
    // Por ejemplo:
    //
    // {
    //   userId: 1,
    //   username: "admin",
    //   role: "admin"
    // }
    //
    // Lo guardamos en req.user para que las rutas
    // posteriores puedan conocer qué usuario
    // está realizando la petición.
    req.user = decoded;


    // ==================================================
    // CONTINUAR HACIA LA RUTA
    // ==================================================

    // next() indica a Express que el middleware
    // terminó correctamente y que puede continuar
    // con el siguiente middleware o endpoint.
    next();

  } catch (error) {

    // Si jwt.verify() falla puede ser porque:
    //
    // - el token expiró;
    // - el token fue modificado;
    // - la firma no coincide;
    // - el token tiene un formato inválido.
    //
    // En cualquiera de esos casos no permitimos
    // acceder a la ruta protegida.
    return res.status(401).json({
      error: "Token inválido o expirado"
    });
  }
}


// ==================================================
// EXPORTAR MIDDLEWARE
// ==================================================

// Exportamos authenticateToken para poder utilizarlo
// desde server.js.
//
// Ejemplo:
//
// app.use(
//   "/api/products",
//   authenticateToken,
//   productsRouter
// );
module.exports = authenticateToken;