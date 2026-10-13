# Dev Catalog

Aplicación web Full Stack para la gestión de inventario y ventas, desarrollada como parte de una prueba técnica.

El sistema permite administrar productos, registrar ventas, controlar automáticamente el inventario, consultar indicadores desde un Dashboard y anular ventas manteniendo la trazabilidad de los movimientos.

La aplicación utiliza una arquitectura de tres capas principales:

```text
Frontend
React + Nginx
      ↓
Backend
Node.js + Express
      ↓
Base de datos
MariaDB
```

Todo el sistema se ejecuta mediante contenedores Docker administrados con Docker Compose.

---

# Arquitectura

```text
Navegador
    │
    │ HTTP :8080
    ▼
┌──────────────────────────┐
│ Frontend                 │
│ React + Vite             │
│ Nginx                    │
│ Puerto interno: 80       │
└────────────┬─────────────┘
             │
             │ /api/*
             ▼
┌──────────────────────────┐
│ Backend                  │
│ Node.js + Express        │
│ Puerto interno: 3000     │
│ JWT / bcrypt             │
└────────────┬─────────────┘
             │
             │ db:3306
             ▼
┌──────────────────────────┐
│ MariaDB 11               │
│ Base de datos persistente│
└────────────┬─────────────┘
             │
             ▼
      Docker Volume
      mariadb_data
```

Nginx sirve los archivos compilados del Frontend y funciona como Reverse Proxy para enviar las solicitudes `/api/` hacia el Backend.

El Backend y MariaDB no se publican directamente hacia el host. La comunicación entre estos servicios se realiza mediante la red interna creada por Docker Compose.

---

# Arquitectura del Backend

El Backend está organizado en capas. Cada capa tiene una única responsabilidad y solo llama a la capa inferior:

```text
Request
  ↓
middleware/    requestLogger, cors, JSON, cookies          (todas las requests)
  ↓
routes/        método + URL → controller                  (index.js marca qué grupos exigen JWT)
  ↓
middleware/    authenticateToken, loginLimiter            (solo en las rutas que los usan)
  ↓
controllers/   lee req, llama al service y responde       (única capa que conoce req y res)
  ↓
services/      validaciones y reglas de negocio           (lanzan HttpError: 400, 404, 409…)
  ↓
repositories/  consultas SQL parametrizadas               (única capa que conoce MariaDB)
  ↓
MariaDB
```

- **Errores centralizados:** los controllers no usan `try/catch`. Express 5 envía los errores de los handlers async a `middleware/errorHandler.js`, que responde con el status y mensaje de un `HttpError`, o con un 500 genérico (y el detalle en el log) para cualquier otro error.
- **Transacciones:** `repositories/withTransaction.js` abre la transacción, hace `COMMIT` si todo termina bien y `ROLLBACK` si se lanza un error. Lo usan el registro y la anulación de ventas.
- **Configuración:** `config.js` es el único módulo que lee variables de entorno.

---

# Arquitectura del Frontend

El Frontend sigue la misma idea de separar responsabilidades:

```text
pages/        coordinan: estado de la pantalla y llamadas a la API
  ↓
components/   solo muestran y avisan con eventos (onEdit, onDelete…)
  ↓
api/          único lugar que hace fetch
```

- **Un solo cliente HTTP** (`api/client.js`): maneja JSON, errores de red, respuestas que no son JSON (por ejemplo un 502 de Nginx) y la sesión vencida: un 401 en una ruta protegida devuelve al login.
- **Validación en dos capas:** el formulario valida para dar una buena experiencia, y el Backend vuelve a validar todo.
- **Estilos propios** en `src/styles/`: las variables de diseño (colores, tipografía, radios) están en `tokens.css`, y el resto de los estilos las usa.

---

# Tecnologías utilizadas

- **Frontend:** React, Vite, React Router, JavaScript, Lucide React y CSS propio (sin frameworks de estilos), con las fuentes IBM Plex Sans e IBM Plex Mono.
- **Backend:** Node.js, Express.js, JWT, bcryptjs, express-rate-limit y mariadb.
- **Base de datos:** MariaDB 11.
- **Servidor web / Reverse Proxy:** Nginx.
- **Contenedores:** Docker CE y Docker Compose.
- **Sistema operativo utilizado durante la prueba:** Rocky Linux.
- **Control de versiones:** Git y GitHub.

---

# Funcionalidades

## Autenticación

El sistema incluye autenticación mediante usuario y contraseña.

Las contraseñas no se almacenan en texto plano. Se almacenan como hashes utilizando `bcrypt`.

Después de validar las credenciales, el Backend genera un JWT firmado y lo almacena en una cookie `HttpOnly`.

Flujo:

```text
Usuario y contraseña
        ↓
POST /api/auth/login
        ↓
Buscar usuario en MariaDB
        ↓
bcrypt.compare()
        ↓
Generar JWT
        ↓
Cookie HttpOnly
        ↓
Usuario autenticado
```

También existe protección contra múltiples intentos fallidos de inicio de sesión mediante Rate Limiting.

---

# Gestión de productos

El módulo de productos implementa operaciones CRUD sobre el catálogo.

Permite:

```text
Visualizar productos
Crear productos
Editar productos
Clasificar productos por categoría
Buscar y filtrar por categoría
Mover productos a papelera
Restaurar productos
Consultar estado del stock
```

Los productos no se eliminan físicamente de la base de datos.

Se utiliza Soft Delete mediante el campo:

```text
activo = 1 → producto activo
activo = 0 → producto en papelera
```

Esto permite conservar relaciones e historial.

---

# Gestión de ventas

El sistema permite registrar ventas seleccionando un producto y la cantidad vendida.

Al registrar una venta:

```text
Seleccionar producto
        ↓
Validar cantidad
        ↓
Validar stock
        ↓
BEGIN TRANSACTION
        ↓
Registrar venta
        ↓
Descontar stock
        ↓
COMMIT
```

El Backend utiliza una transacción para garantizar que el registro de la venta y la actualización del inventario ocurran como una sola operación.

También se utiliza:

```sql
SELECT ... FOR UPDATE
```

para bloquear temporalmente la fila del producto durante la transacción y reducir problemas de concurrencia.

---

# Precio histórico

Cada venta almacena:

```text
precio_unitario
```

Este valor representa el precio que tenía el producto en el momento exacto de la venta.

Ejemplo:

```text
Precio actual del producto: $500
Venta registrada:           $500

Posteriormente:

Nuevo precio del producto:  $600
Venta histórica:            $500
```

De esta manera, modificar el precio actual de un producto no modifica ventas realizadas anteriormente.

Los precios mostrados por la aplicación se expresan en USD.

---

# Anulación de ventas

Las ventas no se eliminan físicamente.

Si una venta fue registrada incorrectamente, puede ser anulada.

Una venta puede tener los siguientes estados:

```text
completada
anulada
```

Al anular una venta:

```text
PATCH /api/sales/:id/cancel
        ↓
BEGIN TRANSACTION
        ↓
Bloquear venta
        ↓
Bloquear producto
        ↓
Devolver unidades al stock
        ↓
estado = anulada
        ↓
Registrar fecha de anulación
        ↓
COMMIT
```

La venta permanece visible en el historial para conservar trazabilidad.

Una venta anulada no forma parte de:

```text
Unidades vendidas
Productos más vendidos
Ventas recientes del Dashboard
```

---

# Dashboard

El Dashboard muestra información general del catálogo y las ventas.

Actualmente presenta:

```text
Productos activos, unidades vendidas, valor del inventario,
productos con stock bajo y agotados (franja de cifras)
Productos que necesitan reposición, con su nivel de stock
Productos más vendidos
Ventas recientes
```

Los indicadores de ventas únicamente toman en cuenta ventas con:

```text
estado = 'completada'
```

---

# Base de datos

El sistema utiliza cuatro tablas.

## categories

```text
id
nombre
created_at
```

`nombre` es único: no pueden existir "Periféricos" y "perifericos" como categorías distintas.

---

## products

```text
id
nombre
descripcion
precio
stock
activo
created_at
updated_at
category_id
```

`activo` permite implementar Soft Delete.

`category_id` es una clave foránea relacionada con `categories.id`. Admite `NULL` para productos creados antes de que existieran las categorías; la API la exige al crear o editar.

---

## users

```text
id
username
password_hash
role
created_at
```

`username` es único.

Las contraseñas se almacenan mediante hashes bcrypt.

---

## sales

```text
id
product_id
cantidad
precio_unitario
estado
created_at
anulada_at
```

`product_id` es una clave foránea relacionada con:

```text
products.id
```

Relaciones:

```text
categories ──< products ──< sales
   id          category_id    product_id
```

Una categoría tiene muchos productos, y un producto tiene muchas ventas.

---

# Endpoints principales

## Autenticación

```http
POST /api/auth/login
```

Inicia sesión.

```http
GET /api/auth/me
```

Comprueba la sesión actual.

```http
POST /api/auth/logout
```

Cierra la sesión y elimina la cookie de autenticación.

---

## Categorías

```http
GET /api/categories
```

Obtiene las categorías, ordenadas por nombre.

---

## Productos

```http
GET /api/products
GET /api/products?categoryId=3
```

Obtiene los productos activos, con su categoría. Con `categoryId` devuelve solo los de esa categoría.

Al crear o editar, el JSON incluye `category_id`; la API responde 400 si falta o si la categoría no existe.

```http
GET /api/products/deleted
```

Obtiene productos ubicados en la papelera.

```http
GET /api/products/:id
```

Obtiene un producto específico.

```http
POST /api/products
```

Crea un producto.

```http
PUT /api/products/:id
```

Actualiza un producto.

```http
DELETE /api/products/:id
```

Realiza Soft Delete del producto.

```http
PATCH /api/products/:id/restore
```

Restaura un producto desde la papelera.

---

## Ventas

```http
GET /api/sales
```

Obtiene el historial completo de ventas, incluyendo ventas completadas y anuladas.

```http
GET /api/sales/summary
```

Obtiene información utilizada por el Dashboard.

```http
POST /api/sales
```

Registra una venta y descuenta automáticamente el inventario.

```http
PATCH /api/sales/:id/cancel
```

Anula una venta y devuelve las unidades correspondientes al inventario.

---

## Salud

```http
GET /api/health
```

Endpoint público. Responde `200` si el Backend está activo y MariaDB responde, o `503` si no hay conexión con la base de datos.

---

# Códigos HTTP utilizados

La API utiliza códigos HTTP según el resultado de las operaciones.

```text
200 OK
Operación realizada correctamente.

201 Created
Recurso creado correctamente.

400 Bad Request
Datos enviados inválidos.

401 Unauthorized
Usuario no autenticado o JWT inválido.

404 Not Found
Recurso no encontrado.

409 Conflict
La operación entra en conflicto con el estado actual.
Ejemplo: intentar anular una venta ya anulada.

429 Too Many Requests
Demasiados intentos de inicio de sesión.

500 Internal Server Error
Error interno del servidor.

503 Service Unavailable
Health check sin conexión a MariaDB.
```

---

# Docker

La aplicación utiliza tres servicios definidos mediante Docker Compose:

```text
frontend
backend
db
```

## Frontend

Se construye mediante un Dockerfile Multi-Stage.

```text
Etapa 1
Node.js
↓
npm ci
↓
npm run build
↓
dist/

Etapa 2
Nginx
↓
copiar dist/
↓
servir aplicación
```

La aplicación se publica mediante:

```text
8080:80
```

---

## Backend

El Backend utiliza:

```text
Node.js 22 Alpine
Express
Puerto interno 3000
```

No se publica directamente hacia el host.

Nginx se comunica con él mediante:

```text
backend:3000
```

---

## MariaDB

MariaDB utiliza:

```text
MariaDB 11
Puerto interno 3306
```

El Backend se comunica con la base mediante:

```text
DB_HOST=db
DB_PORT=3306
```

`db` corresponde al nombre del servicio definido en Docker Compose.

---

# Persistencia

MariaDB utiliza un volumen Docker:

```yaml
mariadb_data:/var/lib/mysql
```

Esto permite conservar los datos aunque el contenedor sea recreado.

El siguiente comando elimina contenedores pero conserva el volumen:

```bash
docker compose down
```

Debe evitarse utilizar:

```bash
docker compose down -v
```

si se desea conservar la información de la base de datos, ya que `-v` también elimina los volúmenes.

---

# Health Check

MariaDB incluye un Health Check.

El Backend depende de:

```yaml
condition: service_healthy
```

De esta forma, Docker espera a que MariaDB esté preparado para recibir conexiones antes de iniciar el Backend.

El Backend expone además `GET /api/health`, que comprueba que la API responde y que puede consultar MariaDB:

```bash
curl http://localhost:8080/api/health
```

---

# Inicialización de la base de datos

El archivo:

```text
database/init.sql
```

se monta dentro del contenedor en:

```text
/docker-entrypoint-initdb.d/init.sql
```

Este archivo permite crear inicialmente las tablas:

```text
categories (con las categorías iniciales)
products
users
sales
```

Los scripts dentro de `/docker-entrypoint-initdb.d/` se ejecutan cuando MariaDB inicializa un directorio de datos nuevo.

Si el volumen `mariadb_data` ya existe, modificar `init.sql` no modifica automáticamente la base de datos que ya está funcionando.

## Migraciones

Para aplicar cambios de estructura a una base que ya existe, sin perder datos, están las migraciones de `database/migrations/`. Cada una se puede ejecutar más de una vez sin efectos.

```bash
docker exec -i dev-test-db sh -c 'mariadb -u"$MARIADB_USER" -p"$MARIADB_PASSWORD" "$MARIADB_DATABASE"' \
  < database/migrations/001_add_categories.sql
```

| Migración | Qué hace |
| --- | --- |
| `001_add_categories.sql` | Crea `categories` con las categorías iniciales y agrega `products.category_id` con su clave foránea |

Una base creada desde cero con el `init.sql` actual ya incluye estos cambios.

---

# Variables de entorno

La configuración sensible se mantiene fuera del código mediante un archivo `.env`.

Ejemplo de estructura:

```env
DB_ROOT_PASSWORD=your_root_password
DB_DATABASE=dev_catalog
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=8h

COOKIE_SECURE=false
```

El archivo `.env` no debe almacenarse en el repositorio.

---

# Ejecutar el proyecto

Clonar el repositorio:

```bash
git clone https://github.com/jpablom2804-ux/dev-test-app.git
cd dev-test-app
```

Crear el archivo `.env` en la raíz con la estructura de la sección [Variables de entorno](#variables-de-entorno). Como contiene credenciales, conviene que solo su dueño pueda leerlo:

```bash
chmod 600 .env
```

Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

Consultar el estado de los servicios:

```bash
docker compose ps
```

Ver logs del Backend:

```bash
docker compose logs backend
```

Ver logs del Frontend:

```bash
docker compose logs frontend
```

Ver logs de MariaDB:

```bash
docker compose logs db
```

La aplicación estará disponible en:

```text
http://localhost:8080
```

o desde el entorno utilizado para acceder a la máquina virtual mediante el puerto configurado.

---

# Crear el usuario administrador

`init.sql` crea las tablas, pero no crea usuarios: ninguna contraseña queda escrita en el repositorio.

Con los contenedores en ejecución, crear el primer usuario:

```bash
docker compose exec backend npm run create-user -- admin 'una-contraseña-segura'
```

El script (`backend/src/scripts/createUser.js`) reutiliza la misma lógica que la API: valida los datos, guarda la contraseña como hash bcrypt y avisa si el usuario ya existe.

Después se puede iniciar sesión en `http://localhost:8080` con ese usuario y contraseña.

---

# Cargar datos de demostración

Para probar la aplicación con un catálogo realista:

```bash
docker compose exec backend npm run seed-demo -- --reset
```

Carga 30 productos en 9 categorías, con variantes como "iPhone 18 Pro 256GB" e "iPhone 18 Pro 1TB", algunos con stock bajo y dos agotados, y 20 ventas de los últimos 6 días (2 anuladas).

- `--reset` borra antes **todos los productos y ventas**. Los usuarios no se tocan. Sin `--reset`, el script se niega a ejecutarse si ya hay productos.
- El script (`backend/src/scripts/seedDemo.js`) reutiliza los services de la API: los productos pasan las mismas validaciones y cada venta descuenta stock dentro de la misma transacción.

---

# Reconstruir servicios

Si cambia código del Backend:

```bash
docker compose up -d --build backend
```

Si cambia código del Frontend:

```bash
docker compose up -d --build frontend
```

Si cambian ambos:

```bash
docker compose up -d --build
```

Reiniciar un contenedor sin reconstruir la imagen no copia automáticamente cambios realizados en archivos incluidos durante el proceso de build.

---

# Seguridad

La aplicación implementa varias medidas básicas:

```text
Contraseñas almacenadas mediante bcrypt
JWT firmado
Cookie HttpOnly
Rate Limiting en login
Consultas SQL parametrizadas
Variables sensibles mediante .env
Backend protegido mediante middleware de autenticación
MariaDB no publicada directamente al host
Backend no publicado directamente al host
Soft Delete
Transacciones para operaciones de ventas
Bloqueo de filas mediante SELECT FOR UPDATE
```

---

# Flujo de autenticación

```text
Login.jsx
    ↓
POST /api/auth/login
    ↓
Rate Limiter
    ↓
Buscar usuario
    ↓
bcrypt.compare()
    ↓
jwt.sign()
    ↓
Cookie HttpOnly
    ↓
App.jsx
    ↓
GET /api/auth/me
    ↓
authenticateToken
    ↓
jwt.verify()
```

---

# Flujo de productos

```text
React
↓
/api/products
↓
Nginx
↓
Express
↓
authenticateToken
↓
routes/products.js
↓
productsController
↓
productsService        (validación)
↓
productsRepository     (SQL)
↓
MariaDB
↓
JSON
↓
React
```

---

# Flujo de una venta

```text
Sales.jsx
↓
POST /api/sales
↓
Nginx
↓
Express
↓
authenticateToken
↓
salesController
↓
salesService
↓
withTransaction → BEGIN TRANSACTION
↓
SELECT producto FOR UPDATE
↓
Validar stock
↓
INSERT sale
↓
UPDATE stock
↓
COMMIT
↓
201 Created
↓
Frontend actualiza información
```

---

# Flujo de anulación

```text
Sales.jsx
↓
Anular venta
↓
PATCH /api/sales/:id/cancel
↓
Backend
↓
BEGIN TRANSACTION
↓
SELECT venta FOR UPDATE
↓
SELECT producto FOR UPDATE
↓
UPDATE stock = stock + cantidad
↓
UPDATE sale estado = anulada
↓
COMMIT
↓
Frontend actualiza historial
```

---

# Estructura general del proyecto

```text
dev-test-app/
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   │
│   └── src/
│       ├── server.js            arranca el servidor y lo cierra limpio con SIGTERM
│       ├── app.js               middlewares globales, rutas y manejo de errores
│       ├── config.js            variables de entorno, leídas en un solo lugar
│       ├── db.js                pool de conexiones a MariaDB
│       │
│       ├── routes/
│       │   ├── index.js         monta los routers y marca cuáles exigen JWT
│       │   ├── auth.js
│       │   ├── health.js
│       │   ├── products.js
│       │   └── sales.js
│       │
│       ├── middleware/
│       │   ├── auth.js          verifica el JWT de la cookie
│       │   ├── loginLimiter.js  rate limit del login
│       │   ├── requestLogger.js
│       │   └── errorHandler.js  respuesta única para errores y 404
│       │
│       ├── controllers/         auth, categories, products, sales
│       ├── services/            auth, categories, products, sales + validators.js
│       ├── repositories/        users, categories, products, sales + withTransaction
│       ├── errors/
│       │   └── HttpError.js
│       └── scripts/
│           ├── createUser.js    crea usuarios desde la terminal
│           └── seedDemo.js      carga el catálogo de demostración
│
├── database/
│   ├── init.sql                 crea las tablas en una base nueva
│   └── migrations/              cambios para una base que ya existe
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              sesión, header y rutas
│       │
│       ├── api/                 client.js + authApi, categoriesApi, productsApi, salesApi
│       ├── hooks/
│       │   └── useApiData.js    carga y recarga los datos de cada página
│       ├── utils/               format.js (fechas, precios), stock.js (reglas de stock)
│       │
│       ├── components/          AppHeader, UserMenu, PageHeader, Modal, ConfirmDialog,
│       │   │                    FeedbackMessage, StockLevel
│       │   ├── products/        ProductTabs, ProductsTable, ProductFormModal, ProductsEmpty
│       │   └── sales/           SaleForm, SaleSummary, SalesHistory
│       │
│       ├── pages/               Login, Dashboard, Products, Sales
│       │
│       └── styles/              tokens, base, layout, components y uno por pantalla
│
├── compose.yaml
├── .gitignore
└── README.md
```

---

# Decisiones de diseño

## Soft Delete

Los productos no se eliminan físicamente para conservar referencias e historial.

## Precio histórico

Las ventas almacenan el precio utilizado en el momento de la operación.

## Anulación en lugar de edición de ventas

Una venta ya registrada no se modifica silenciosamente.

Si existe un error, la venta se anula, el stock se reintegra y el movimiento permanece disponible en el historial.

Esto mantiene mayor trazabilidad.

## Transacciones

El registro y la anulación de ventas utilizan transacciones para mantener consistencia entre el inventario y el historial.

## Reverse Proxy

El navegador solamente necesita comunicarse con Nginx.

Nginx sirve React y redirige las solicitudes `/api/` hacia Express.

## Docker Compose

Los tres componentes principales se mantienen separados:

```text
Frontend
Backend
Database
```

permitiendo administrar, reconstruir y desplegar cada servicio de manera independiente.

---

# Estado del proyecto

Actualmente el sistema permite demostrar integración completa entre:

```text
React
Nginx
Node.js / Express
JWT
MariaDB
Docker
Docker Compose
Git
```

La aplicación implementa autenticación, gestión de productos, persistencia, ventas, control de inventario, transacciones, Dashboard, historial y anulación de operaciones.