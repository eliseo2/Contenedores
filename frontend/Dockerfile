# Etapa de construcción
FROM node:20-alpine as build

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de archivos de la aplicación
COPY . .

# Variable de entorno para la API (se sobreescribirá en docker-compose.yml)
ENV REACT_APP_API_URL=http://localhost:5000

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Crear un usuario no privilegiado para cumplir con el principio de menor privilegio
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar la configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos de construcción desde la etapa anterior
COPY --from=build /app/build /usr/share/nginx/html

COPY .env /usr/share/nginx/html/.env

# Cambiar propietario de los archivos estáticos
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Nginx se ejecuta como root pero podemos reducir privilegios en la configuración
CMD ["nginx", "-g", "daemon off;"]