const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { jwtSecret, jwtExpiresIn } = require("../config");
const HttpError = require("../errors/HttpError");
const usersRepository = require("../repositories/usersRepository");

// Costo de bcrypt: 2^12 rondas. Más alto es más lento de calcular,
// y por eso más caro de atacar por fuerza bruta.
const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 8;

// Hash "señuelo" con el mismo costo que los reales. Si el usuario no existe,
// se compara contra este hash para que la respuesta tarde lo mismo que con
// un usuario real: así el tiempo de respuesta no revela qué usuarios existen.
// Se calcula una sola vez, en segundo plano, al cargar el módulo.
const dummyHashPromise = bcrypt.hash("usuario-inexistente", BCRYPT_COST);

// Devuelve el username sin espacios sobrantes, o lanza 400 si falta algún dato.
function requireCredentials({ username, password } = {}) {
  if (!username || typeof username !== "string" || !password || typeof password !== "string") {
    throw new HttpError(400, "Usuario y contraseña son obligatorios");
  }

  return username.trim();
}

// Verifica las credenciales y devuelve el JWT de la sesión
// junto con los datos del usuario que se pueden enviar al cliente.
// FLUJO LOGIN 7 · Las reglas del login. Siguiente: Ctrl+clic en "findByUsername".
// Después, de vuelta aquí: bcrypt.compare y jwt.sign. El resultado vuelve al
// controller con return; si algo falla, el HttpError va directo a errorHandler.
async function login(credentials) {
  const username = requireCredentials(credentials);
  const { password } = credentials;
  const user = await usersRepository.findByUsername(username);

  // bcrypt se ejecuta siempre, exista o no el usuario.
  const passwordHash = user?.password_hash ?? (await dummyHashPromise);
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  // Mismo mensaje y mismo tiempo si el usuario no existe o si la contraseña
  // no coincide, para no revelar qué usuarios existen.
  if (!user || !passwordMatches) {
    throw new HttpError(401, "Credenciales incorrectas");
  }

  const publicUser = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  return { token, user: publicUser };
}

// Crea un usuario guardando solo el hash de su contraseña. Devuelve su ID.
async function createUser(credentials) {
  const username = requireCredentials(credentials);
  const { password } = credentials;

  // El límite corresponde a la columna username de MariaDB.
  if (username.length > 100) {
    throw new HttpError(400, "El usuario no puede superar 100 caracteres");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return await usersRepository.create({ username, passwordHash });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, `El usuario "${username}" ya existe`);
    }
    throw error;
  }
}

module.exports = {
  login,
  createUser,
};
