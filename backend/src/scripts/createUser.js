// Crea un usuario desde la terminal, reutilizando la misma lógica que la API.
// Uso dentro del contenedor:
//   docker compose exec backend npm run create-user -- <usuario> <contraseña>
require("dotenv").config();

const pool = require("../db");
const authService = require("../services/authService");

async function main() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Uso: npm run create-user -- <usuario> <contraseña>");
    process.exitCode = 1;
    return;
  }

  const id = await authService.createUser({ username, password });
  console.log(`Usuario "${username.trim()}" creado con ID ${id}.`);
}

main()
  .catch((error) => {
    // Un HttpError trae un mensaje pensado para mostrarse; cualquier otro, el detalle técnico.
    console.error(`No se pudo crear el usuario: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
