# Dev Test - Catálogo de Productos

Aplicación web Full Stack desarrollada como parte de una prueba técnica de Infraestructura y Desarrollo.

El sistema permite administrar un catálogo de productos mediante una API REST, utilizando una arquitectura Frontend, Backend y Base de Datos contenerizada con Docker.

## Tecnologías

### Frontend
- React
- Vite
- JavaScript
- React Router
- Bootstrap

### Backend
- Node.js
- Express
- API REST

### Base de datos
- MariaDB

### Infraestructura
- Rocky Linux
- Nginx
- Docker CE
- Docker Compose
- Git
- GitHub

## Arquitectura

Navegador
    |
    v
React / Nginx
    |
    | /api
    v
Node.js / Express
    |
    v
MariaDB

La solución se ejecuta mediante Docker Compose utilizando tres servicios principales:

- Frontend
- Backend
- MariaDB

## Funcionalidades

- Inicio y cierre de sesión.
- Visualización de productos.
- Creación de productos.
- Modificación de productos.
- Eliminación lógica de productos.
- Restauración de productos.
- Búsqueda de productos.
- Validación de datos.
- Manejo de mensajes de éxito y error.

## API REST

### Autenticación

POST /api/auth/login
GET /api/auth/me
POST /api/auth/logout

### Productos

GET    /api/products
GET    /api/products/deleted
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
PATCH  /api/products/:id/restore

## Códigos HTTP utilizados

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

## Base de datos

La aplicación utiliza dos tablas principales:

- products
- users

La información se almacena en MariaDB y se conserva mediante un volumen Docker.

## Estructura general

dev-test-app/
├── backend/
│   ├── src/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   └── init.sql
├── compose.yaml
├── .gitignore
└── README.md

## Configuración

Crear un archivo .env en la raíz del proyecto con las variables requeridas por compose.yaml.

Las credenciales y secretos no se almacenan en el repositorio.

## Ejecución

Construir e iniciar la aplicación:

docker compose up -d --build

Verificar los servicios:

docker compose ps

Acceder a la aplicación:

http://127.0.0.1:8080

## Comandos útiles

docker compose up -d
docker compose stop
docker compose start
docker compose restart
docker compose ps
docker compose logs backend
docker compose logs db

## Control de versiones

El proyecto utiliza Git y GitHub para control de versiones y manejo de ramas.
