# Aplicación Full-Stack con Monitorización

Este repositorio contiene una aplicación containerizada lista para producción con frontend, servicios backend, base de datos, balanceador de carga y un stack completo de monitorización.

## Arquitectura

El proyecto consta de los siguientes componentes:

- **Frontend**: Aplicación React
- **Backend**: Servicios duales de Node.js para alta disponibilidad
- **Base de datos**: MySQL 8.0
- **Balanceador de carga**: Nginx para enrutamiento y terminación SSL
- **Stack de monitorización**:
  - Grafana para dashboards y visualización
  - Loki para agregación de logs
  - Promtail para recolección de logs
- **Herramientas de administración**:
  - Adminer para gestión de base de datos
  - Portainer para administración de contenedores Docker

## Arquitectura de red

La aplicación utiliza tres redes Docker aisladas:
- `frontend-network`: Para servicios orientados al público
- `backend-network`: Red interna para servicios backend y base de datos (no accesible desde el exterior)
- `monitoring-network`: Para servicios de monitorización

## Prerrequisitos

- Docker y Docker Compose
- Certificados SSL (para despliegue en producción)

## Estructura de directorios

```
.
├── docker-compose.yml
├── frontend/
│   └── Dockerfile
├── backend/
│   ├── Dockerfile
│   └── .env
├── loadbalancer/
│   └── Dockerfile
├── db/
│   └── init.sql
├── ssl/
│   ├── cert.pem
│   └── key.pem
└── loki/
    ├── loki-config.yaml
    ├── promtail-config.yaml
    └── grafana-datasources.yaml
```

## Archivos de configuración

Antes del despliegue, asegúrate de tener:

1. Configuración del frontend en `./frontend/`
2. Variables de entorno del backend en `./backend/.env`
3. Script de inicialización de base de datos en `./db/init.sql`
4. Certificados SSL en `./ssl/`
5. Configuraciones de Loki, Promtail y Grafana en `./loki/`

## Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <directorio-del-repositorio>
```

### 2. Configurar tu entorno

Modifica los archivos de configuración según las necesidades de tu entorno:

- Actualiza las variables de entorno del backend en `./backend/.env`
- Configura la inicialización de la base de datos en `./db/init.sql`
- Añade tus certificados SSL en `./ssl/`

### 3. Iniciar la aplicación

```bash
docker-compose up -d
```

Este comando iniciará todos los servicios en modo detached.

### 4. Monitorizar el despliegue

```bash
docker-compose ps
```

## Puntos de acceso

Después del despliegue, puedes acceder a:

- **Aplicación principal:** https://localhost (Puerto 80/443)
- **Dashboard de Grafana:** http://localhost:3000
- **Adminer (Administración de BD):** http://localhost:8080
- **Portainer (Administración Docker):** http://localhost:9000
- **API de Loki:** http://localhost:3100

## Límites de recursos

Los servicios han sido configurados con los siguientes límites de recursos:

- Servicios backend: 1 CPU, 512MB RAM
- Servicios de monitorización: 0.25-0.5 CPU, 128-256MB RAM

## Logs

Todos los logs de la aplicación son recolectados por Promtail y almacenados en Loki, accesibles a través de dashboards de Grafana. Los logs también están disponibles a través de los mecanismos estándar de Docker:

```bash
docker-compose logs -f [nombre_del_servicio]
```

## Consideraciones de seguridad

- La red backend es interna y no accesible desde el exterior
- Los contenedores tienen capacidades restringidas usando `cap_drop` y `cap_add`
- La base de datos utiliza autenticación fuerte
- La opción de seguridad no-new-privileges está habilitada para servicios críticos

## Respaldo y persistencia de datos

Los siguientes datos persisten a través de volúmenes Docker:

- Base de datos MySQL: `mysql_data`
- Configuración de Portainer: `portainer_data`
- Logs de Loki: `loki_data`
- Dashboards y configuración de Grafana: `grafana_data`

Para respaldar estos volúmenes, utiliza los métodos de respaldo de volúmenes de Docker.

## Mantenimiento

### Escalado

Para escalar servicios backend:

```bash
docker-compose up -d --scale backend=3
```

### Actualizaciones

Para actualizar servicios:

```bash
docker-compose pull
docker-compose up -d
```

### Solución de problemas

Problemas comunes:

1. **Problemas de conexión a base de datos**: Verifica que la base de datos esté sana con `docker-compose ps db`
2. **Problemas del balanceador de carga**: Revisa los logs de Nginx con `docker-compose logs loadbalancer`
3. **Problemas de monitorización**: Verifica que Loki y Grafana estén funcionando correctamente
