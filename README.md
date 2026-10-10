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

# Tecnologías utilizadas

- **Frontend:** React, Vite, React Router, JavaScript, Lucide React y CSS.
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
Buscar productos
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
Total de productos
Unidades vendidas
Productos con stock bajo
Productos sin stock
Productos más vendidos
Ventas recientes
```

Los indicadores de ventas únicamente toman en cuenta ventas con:

```text
estado = 'completada'
```

---

# Base de datos

El sistema utiliza tres tablas principales.

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
```

`activo` permite implementar Soft Delete.

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

Relación:

```text
products
   │
   │ id
   │
   ▼
sales.product_id
```

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

## Productos

```http
GET /api/products
```

Obtiene los productos activos.

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
products
users
sales
```

Los scripts dentro de `/docker-entrypoint-initdb.d/` se ejecutan cuando MariaDB inicializa un directorio de datos nuevo.

Si el volumen `mariadb_data` ya existe, modificar `init.sql` no modifica automáticamente la base de datos que ya está funcionando.

Para cambios posteriores en un entorno existente se deben ejecutar las migraciones o instrucciones SQL correspondientes.

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
products.js
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
sales.js
↓
BEGIN TRANSACTION
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
│       ├── server.js
│       ├── db.js
│       │
│       ├── middleware/
│       │   └── auth.js
│       │
│       └── routes/
│           ├── auth.js
│           ├── products.js
│           └── sales.js
│
├── database/
│   └── init.sql
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   │
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       │
│       ├── components/
│       │   └── Sidebar.jsx
│       │
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Products.jsx
│           └── Sales.jsx
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