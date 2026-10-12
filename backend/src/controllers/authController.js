const { authCookieName, cookieSecure } = require("../config");
const authService = require("../services/authService");

// El JWT viaja en una cookie HttpOnly para que el JavaScript del navegador
// no pueda leerlo. clearCookie necesita las mismas opciones para borrarla.
const cookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: "lax",
  path: "/",
};

async function login(req, res) {
  const { token, user } = await authService.login(req.body);
  res.cookie(authCookieName, token, cookieOptions);
  res.json({ message: "Inicio de sesión correcto", user });
}

// authenticateToken ya verificó el JWT y dejó su payload en req.user.
function me(req, res) {
  const { userId, username, role } = req.user;
  res.json({ user: { id: userId, username, role } });
}

function logout(req, res) {
  res.clearCookie(authCookieName, cookieOptions);
  res.json({ message: "Sesión cerrada correctamente" });
}

module.exports = {
  login,
  me,
  logout,
};
