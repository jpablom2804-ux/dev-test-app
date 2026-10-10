# ==================================================
# ETAPA 1 - CONSTRUIR EL FRONTEND
# ==================================================
#
# Utilizamos Node.js 22 sobre Alpine Linux.
#
# Esta etapa solamente se utiliza para:
#
# - instalar dependencias;
# - compilar React;
# - generar la carpeta dist.
#
# "AS build" asigna el nombre "build"
# a esta primera etapa.
#
FROM node:22-alpine AS build


# ==================================================
# DIRECTORIO DE TRABAJO
# ==================================================
#
# Los siguientes comandos se ejecutarán
# dentro de /app.
#
WORKDIR /app


# ==================================================
# COPIAR ARCHIVOS DE DEPENDENCIAS
# ==================================================
#
# Copiamos primero:
#
# package.json
# package-lock.json
#
# Hacer esto antes de copiar todo el proyecto
# permite aprovechar mejor la caché de Docker.
#
COPY package*.json ./


# ==================================================
# INSTALAR DEPENDENCIAS
# ==================================================
#
# npm ci instala exactamente las versiones
# definidas en package-lock.json.
#
# En este caso NO usamos --omit=dev porque
# necesitamos herramientas de desarrollo como Vite
# para poder ejecutar npm run build.
#
RUN npm ci


# ==================================================
# COPIAR CÓDIGO DEL FRONTEND
# ==================================================
#
# Copiamos todos los archivos restantes
# del proyecto dentro de /app.
#
COPY . .


# ==================================================
# COMPILAR REACT
# ==================================================
#
# Ejecutamos el script "build"
# definido en package.json.
#
# En este proyecto Vite genera:
#
# /app/dist
#
# Esa carpeta contiene la versión final
# del Frontend:
#
# - HTML
# - CSS
# - JavaScript
#
RUN npm run build



# ==================================================
# ETAPA 2 - SERVIDOR NGINX
# ==================================================
#
# Comenzamos una segunda etapa.
#
# Esta será la imagen final del Frontend.
#
# Ya no necesitamos Node.js porque React
# ya fue compilado a archivos estáticos.
#
FROM nginx:alpine


# ==================================================
# CONFIGURACIÓN PERSONALIZADA DE NGINX
# ==================================================
#
# Sustituimos la configuración por defecto
# de Nginx por nuestro archivo nginx.conf.
#
# Este archivo se encarga de:
#
# - servir React;
# - manejar React Router;
# - actuar como reverse proxy para /api/.
#
COPY nginx.conf /etc/nginx/conf.d/default.conf


# ==================================================
# COPIAR RESULTADO DEL BUILD
# ==================================================
#
# Copiamos la carpeta dist generada
# en la primera etapa.
#
# --from=build significa:
#
# "copiar desde la etapa llamada build".
#
# /app/dist
#       ↓
# /usr/share/nginx/html
#
# /usr/share/nginx/html es la carpeta
# desde donde Nginx servirá la aplicación.
#
COPY --from=build /app/dist /usr/share/nginx/html


# ==================================================
# PUERTO DE NGINX
# ==================================================
#
# Nginx escucha internamente
# en el puerto 80.
#
# EXPOSE solamente documenta el puerto.
#
# Docker Compose es quien realmente lo publica:
#
# 8080:80
#
EXPOSE 80