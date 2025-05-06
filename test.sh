#!/bin/bash

# Script para probar las reglas de alerta de seguridad
# Uso: ./test-security.sh <host> <puerto>
# Ejemplo: ./test-security.sh localhost 80

HOST=${1:-localhost}
PORT=${2:-80}
BACKEND_SERVICE="backend1"

echo "Iniciando pruebas de seguridad en $HOST:$PORT..."

# Función para enviar peticiones
send_requests() {
  local url=$1
  local count=$2
  local type=$3
  
  echo "Enviando $count peticiones $type a $url..."
  
  for i in $(seq 1 $count); do
    if [ "$type" == "error" ]; then
      # Para crear errores 404
      curl -s -o /dev/null -w "%{http_code}\n" "http://$HOST:$PORT/$url/invalid-path-$RANDOM"
    else
      # Para peticiones normales
      curl -s -o /dev/null -w "%{http_code}\n" "http://$HOST:$PORT/$url"
    fi
    sleep 0.2
  done
}

# 1. Simular intentos de login fallidos
echo "Simulando intentos de login fallidos..."
docker exec $BACKEND_SERVICE bash -c 'for i in {1..10}; do echo "$(date) - ERROR: Login failed for user admin - Invalid credentials" >> /var/log/auth.log; sleep 1; done'

# 2. Simular intentos de SQL Injection
echo "Simulando intentos de SQL Injection..."
urls=(
  "api/users?id=1' OR '1'='1"
  "api/login?username=admin'--"
  "api/search?q=test%27%20OR%201=1;--"
  "api/data?filter=x' UNION SELECT * FROM users--"
)

for url in "${urls[@]}"; do
  curl -s -o /dev/null "http://$HOST:$PORT/$url"
  sleep 1
done

# 3. Simular respuestas 401/403 (accesos no autorizados)
echo "Simulando accesos no autorizados..."
protected_urls=(
  "api/admin"
  "api/settings"
  "api/users/delete"
  "api/config"
)

for url in "${protected_urls[@]}"; do
  for i in {1..5}; do
    curl -s -o /dev/null -H "Authorization: Bearer invalid-token" "http://$HOST:$PORT/$url"
    sleep 0.5
  done
done

# 4. Simular posible ataque de fuerza bruta (muchos 404)
echo "Simulando ataque de fuerza bruta (muchos 404)..."
send_requests "api" 25 "error"

# 5. Simular alto volumen de tráfico
echo "Simulando alto volumen de tráfico..."
send_requests "" 50 "normal"

echo "Pruebas de seguridad completadas. Verifica las alertas en Grafana y Alertmanager."
echo "Accede a Grafana: http://$HOST:3000"
echo "Accede a Alertmanager: http://$HOST:9093"