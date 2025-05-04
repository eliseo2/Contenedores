FROM nginx:alpine

# Crear directorio para certificados SSL
RUN mkdir -p /etc/nginx/ssl

# Crear certificados SSL autofirmados para desarrollo
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=XX/ST=State/L=City/O=Organization/CN=localhost" && \
    chmod 600 /etc/nginx/ssl/nginx.key

# Eliminar la configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra configuración
COPY nginx.conf /etc/nginx/nginx.conf

# Crear un archivo de HTML para páginas de error
COPY 50x.html /usr/share/nginx/html/50x.html
COPY 404.html /usr/share/nginx/html/404.html

# Ajustar permisos para un mejor nivel de seguridad
RUN chown -R nginx:nginx /etc/nginx/ssl && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html


# Configuración de permisos explícitos
RUN mkdir -p /var/run/nginx && \
    chmod -R 777 /var/run/nginx && \
    chown -R nginx:nginx /var/run/nginx


# Exponer puertos HTTP y HTTPS
EXPOSE 80 443

RUN mkdir -p /var/run/nginx && \
    chown nginx:nginx /var/run/nginx

CMD ["nginx", "-g", "daemon off;"]