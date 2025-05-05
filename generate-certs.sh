#!/bin/bash

# Crear directorio para certificados
mkdir -p ./ssl

# Generar clave privada
openssl genrsa -out ./ssl/server.key 2048

# Generar certificado autofirmado (comando separado)
openssl req -new -x509 -days 365 -key ./ssl/server.key -out ./ssl/server.crt -subj "//C=XX\ST=State\L=City\O=Organization\CN=localhost"

# Ajustar permisos (puede que no funcionen igual en Windows)
chmod 600 ./ssl/server.key
chmod 644 ./ssl/server.crt

echo "Certificados SSL generados correctamente en ./ssl/"
ls -la ./ssl/