FROM node:20-alpine

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error

# Instalar herramientas necesarias y dependencias para compilación
RUN apk --no-cache add wget curl python3 make g++ 

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiamos solo package.json primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar dependencias con manejo de errores
RUN npm ci --unsafe-perm || (echo "Detalles del error de npm ci:" && cat npm-debug.log && exit 1)
RUN npm cache clean --force

# Auditoría de seguridad de paquetes
RUN npm audit || true

# Crear directorio de logs y asignar permisos
RUN mkdir -p logs && chown -R appuser:appgroup logs

# Copiar archivos de la aplicación
COPY --chown=appuser:appgroup . .

# Verificar configuraciones de seguridad
RUN find /app -type f -name "*.js" -exec grep -l "eval(" {} \; | xargs -r echo "Advertencia: uso potencialmente inseguro de eval en:"
RUN find /app -type f -name "*.js" -exec grep -l "child_process" {} \; | xargs -r echo "Advertencia: uso de child_process en:"

ENV PORT=5000
ENV HTTPS_PORT=5443

# Exponer puertos HTTP y HTTPS
EXPOSE $PORT $HTTPS_PORT

USER appuser

# Verificación de salud usando HTTP endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:$PORT/ || exit 1

CMD ["node", "index.js"]