# Dev Test - Catálogo de Productos

Aplicación web full stack desarrollada como parte de una prueba técnica.

## Tecnologías

### Frontend
- React
- Vite
- JavaScript

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

## Arquitectura

Navegador
   |
   v
React / Vite
   |
   v
Express REST API
   |
   v
MariaDB

## Funcionalidades

El sistema permite administrar un catálogo de productos mediante operaciones CRUD:

- Crear productos
- Consultar productos
- Editar productos
- Eliminar productos
- Validar datos
- Mostrar mensajes de éxito y error

## API REST

### Obtener productos

GET /api/products

### Obtener producto por ID

GET /api/products/:id

### Crear producto

POST /api/products

### Actualizar producto

PUT /api/products/:id

### Eliminar producto

DELETE /api/products/:id

## Códigos HTTP utilizados

- 200 OK
- 201 Created
- 400 Bad Request
- 404 Not Found
- 500 Internal Server Error

## Seguridad

Las credenciales de la base de datos se administran mediante variables de entorno.

El archivo .env no se almacena en Git.

Las consultas SQL utilizan parámetros para evitar concatenar directamente datos proporcionados por el usuario.

## Estructura

dev-test-app/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   └── routes/
│   │       └── products.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
├── .gitignore
└── README.md

## Objetivo

Demostrar conocimientos de administración Linux, desarrollo web, APIs REST, bases de datos, Git, Docker y despliegue mediante contenedores.
