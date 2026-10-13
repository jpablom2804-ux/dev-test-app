import { useCallback, useEffect, useState } from "react";

// Carga datos del Backend al montar el componente y permite recargarlos
// después de una operación (crear, editar, anular…).
// `load` debe definirse fuera del componente para que no cambie en cada render.
export function useApiData(load, initialData) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Todos los cambios de estado ocurren cuando llega la respuesta, nunca
  // antes, así que se puede llamar desde useEffect sin renders en cascada.
  const reload = useCallback(
    () =>
      load()
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((loadError) => setError(loadError.message))
        .finally(() => setLoading(false)),
    [load]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
