const pool = require("../db");

// Ejecuta `work` dentro de una transacción y le pasa la conexión que debe usar.
// Si `work` termina bien se hace COMMIT; si lanza un error se hace ROLLBACK
// y el error se relanza para que llegue al errorHandler.
async function withTransaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Error haciendo rollback:", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = withTransaction;
