Aplicación Full-Stack con Monitoreo
Este repositorio contiene una aplicación contenedorizada lista para producción con frontend, servicios backend, base de datos, balanceador de carga y un conjunto completo de monitoreo. Arquitectura
El proyecto consta de los siguientes componentes:

Frontend: Aplicación React
Backend: Servicios duales Node.js para alta disponibilidad
Base de datos: MySQL 8.0
Balanceador de carga: Nginx para enrutamiento y terminación SSL
Stack de monitorización:

Grafana para paneles de control y visualización
Loki para la agregación de registros
Promtail para la recopilación de registros

Herramientas de administración:

Adminer para la gestión de bases de datos
Portainer para la gestión de contenedores Docker

Arquitectura de red
La aplicación utiliza tres redes Docker aisladas:

frontend-network: Para servicios públicos
backend-network: Red interna para servicios backend y base de datos (no accesible desde el exterior)
monitoring-network: Para servicios de monitorización

Requisitos previos

Docker y Docker Compose
Certificados SSL (para la implementación en producción)

Estructura de directorios

├── docker-compose.yml
├── frontend/
│ └── Dockerfile
├── backend/
│ ├── Dockerfile
│ └── .env
├── loadbalancer/
│ └── Dockerfile
├── db/
│ └── init.sql
├── ssl/
│ ├── cert.pem
│ └── key.pem
└── loki/
├── loki-config.yaml ├── promtail-config.yaml
└── grafana-datasources.yaml
Archivos de configuración
Antes de la implementación, asegúrese de tener:

Configuración del frontend en ./frontend/
Variables de entorno del backend en ./backend/.env
Script de inicialización de la base de datos en ./db/init.sql
Certificados SSL en ./ssl/
Configuraciones de Loki, Promtail y Grafana en ./loki/

Instalación e implementación
1. Clonar el repositorio
bashgit clone <url-del-repositorio>
cd <directorio-del-repositorio>
2. Configurar su entorno
Modifique los archivos de configuración según las necesidades de su entorno:

Actualizar las variables de entorno del backend en ./backend/.env
Configurar la inicialización de la base de datos en ./db/init.sql
Agregar sus certificados SSL a ./ssl/

3. Iniciar Aplicación
bashdocker-compose up -d
Este comando iniciará todos los servicios en modo independiente. 4. Supervisar la implementación
bashdocker-compose ps
Puntos de acceso
Tras la implementación, puede acceder a:

Aplicación principal: https://localhost (Puerto 80/443)
Panel de control de Grafana: http://localhost:3000

Credenciales predeterminadas: admin/admin

Administrador (Administrador de la base de datos): http://localhost:8080

Servidor: db
Nombre de usuario: appuser
Contraseña: apppassword

Portainer (Administrador de Docker): http://localhost:9000
API de Loki: http://localhost:3100

Límites de recursos
Los servicios se han configurado con los siguientes límites de recursos:

Servicios de backend: 1 CPU, 512 MB de RAM
Servicios de monitorización: 0,25-0,5 CPU, 128-256 MB de RAM

Registros
Promtail recopila todos los registros de la aplicación y los almacena en Loki, accesibles a través de los paneles de control de Grafana. Los registros también están disponibles a través de los mecanismos estándar de Docker:
bashdocker-compose logs -f [service_name]
Consideraciones de seguridad

La red backend es interna y no es accesible desde el exterior.
Los contenedores tienen capacidades restringidas mediante cap_drop y cap_add.
La base de datos utiliza autenticación robusta.
La opción de seguridad "sin nuevos privilegios" está habilitada para servicios críticos.

Copia de seguridad y persistencia de datos
Los siguientes datos se conservan a través de volúmenes de Docker:

Base de datos MySQL: mysql_data
Configuración de Portainer: portainer_data
Registros de Loki: loki_data
Paneles y configuración de Grafana: grafana_data

Para realizar una copia de seguridad de estos volúmenes, utilice los métodos de copia de seguridad de volúmenes de Docker. Mantenimiento
Escalado
Para escalar los servicios backend:
bashdocker-compose up -d --scale backend=3
Actualizaciones
Para actualizar los servicios:
bashdocker-compose pull
docker-compose up -d
Solución de problemas
Problemas comunes:

Problemas de conexión a la base de datos: Asegúrese de que la base de datos esté en buen estado con docker-compose ps db
Problemas con el balanceador de carga: Compruebe los registros de Nginx con docker-compose logs loadbalancer
Problemas de monitorización: Verifique que Loki y Grafana funcionen correctamente
