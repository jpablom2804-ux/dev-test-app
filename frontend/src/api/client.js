// Único punto del frontend que habla con el Backend. Los componentes llaman
// a productsApi, salesApi y authApi, y nunca usan fetch directamente.

let handleUnauthorized = () => {};

// App registra aquí qué hacer cuando una ruta protegida responde 401,
// por ejemplo cuando el JWT expira con la aplicación abierta.
export function onUnauthorized(handler) {
  handleUnauthorized = handler;
}

// Envía una request JSON y devuelve el cuerpo de la respuesta.
// Si el Backend responde con error, lanza un Error con el mensaje que envió.
export async function apiRequest(method, url, body) {
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  }

  // Si el Backend está caído, Nginx responde con una página HTML y no con JSON.
  const data = await response.json().catch(() => null);

  // En /api/auth un 401 es una respuesta normal (credenciales incorrectas,
  // o todavía no hay sesión); en el resto significa que la sesión se perdió.
  if (response.status === 401 && !url.startsWith("/api/auth/")) {
    handleUnauthorized();
  }

  if (!response.ok) {
    throw new Error(data?.error ?? "El servidor no está disponible. Intenta de nuevo en unos segundos.");
  }

  return data;
}
