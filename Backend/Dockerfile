# Usar una imagen base de Node.js
FROM node:20-alpine

# Crear un usuario no privilegiado para cumplir con el principio de menor privilegio
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Directorio de trabajo
WORKDIR /app

# Copiar primero package.json y package-lock.json para aprovechar caché de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de archivos de la aplicación
COPY . .

# Cambiar propietario de los archivos al usuario no privilegiado
RUN chown -R appuser:appgroup /app

# Cambiar al usuario no privilegiado
USER appuser

# Exponer puerto
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["npm", "start"]