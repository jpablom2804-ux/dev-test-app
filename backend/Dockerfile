# ==================================================
# IMAGEN BASE
# ==================================================
#
# Utilizamos Node.js 22 sobre Alpine Linux.
#
# Alpine es una distribución ligera,
# por lo que ayuda a mantener la imagen
# relativamente pequeña.
#
FROM node:22-alpine


# ==================================================
# DIRECTORIO DE TRABAJO
# ==================================================
#
# A partir de este punto, los comandos
# se ejecutarán dentro de /app
# en el contenedor.
#
# Si /app no existe, Docker lo crea.
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
# Esto permite aprovechar mejor
# la caché de construcción de Docker.
#
# Si las dependencias no cambian,
# Docker puede reutilizar la capa
# de npm ci en futuros builds.
#
COPY package*.json ./


# ==================================================
# INSTALAR DEPENDENCIAS
# ==================================================
#
# npm ci instala las dependencias utilizando
# exactamente las versiones registradas
# en package-lock.json.
#
# Es más apropiado para builds reproducibles
# que npm install.
#
# --omit=dev evita instalar dependencias
# utilizadas únicamente durante desarrollo.
#
RUN npm ci --omit=dev


# ==================================================
# COPIAR CÓDIGO DEL BACKEND
# ==================================================
#
# Copiamos la carpeta src del proyecto
# dentro del contenedor.
#
# Resultado:
#
# backend/src
#      ↓
# /app/src
#
COPY src ./src


# ==================================================
# DOCUMENTAR PUERTO
# ==================================================
#
# El Backend escucha internamente
# en el puerto 3000.
#
# EXPOSE documenta qué puerto utiliza
# la aplicación dentro del contenedor.
#
# IMPORTANTE:
# EXPOSE NO publica el puerto hacia el host.
#
# En nuestro Docker Compose el Backend
# permanece dentro de la red interna
# y Nginx se comunica con él directamente.
#
EXPOSE 3000


# ==================================================
# COMANDO DE INICIO
# ==================================================
#
# Este comando se ejecuta cuando
# el contenedor inicia.
#
# Equivale a ejecutar:
#
# npm start
#
# npm buscará el script "start"
# definido dentro de package.json.
#
CMD ["npm", "start"]