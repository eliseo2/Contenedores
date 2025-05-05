# Modificar tu Dockerfile para incluir las dependencias directamente
FROM node:20-alpine

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error

RUN apk --no-cache add wget curl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

# Aquí instalamos todas las dependencias, incluyendo las nuevas
RUN npm ci \
    && npm cache clean --force

# Auditoria de seguridad de paquetes
RUN npm audit

# Crear directorio de logs y asignar permisos
RUN mkdir -p logs && chown -R appuser:appgroup logs

COPY --chown=appuser:appgroup . .

ENV PORT=5000

RUN find /app -type f -name "*.js" -exec grep -l "eval(" {} \; | xargs -r echo "Advertencia: uso potencialmente inseguro de eval en:"
RUN find /app -type f -name "*.js" -exec grep -l "child_process" {} \; | xargs -r echo "Advertencia: uso de child_process en:"

USER appuser

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/ || exit 1

CMD ["node", "index.js"]