Full-Stack Application with Monitoring
This repository contains a production-ready containerized application with frontend, backend services, database, load balancer, and a complete monitoring stack.
Architecture
The project consists of the following components:

Frontend: React application
Backend: Dual Node.js services for high availability
Database: MySQL 8.0
Load Balancer: Nginx for routing and SSL termination
Monitoring Stack:

Grafana for dashboards and visualization
Loki for log aggregation
Promtail for log collection


Admin Tools:

Adminer for database management
Portainer for Docker container management



Network Architecture
The application uses three isolated Docker networks:

frontend-network: For public-facing services
backend-network: Internal network for backend services and database (not accessible from outside)
monitoring-network: For monitoring services

Prerequisites

Docker and Docker Compose
SSL certificates (for production deployment)

Directory Structure
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
Configuration Files
Before deployment, ensure you have:

Frontend configuration in ./frontend/
Backend environment variables in ./backend/.env
Database initialization script in ./db/init.sql
SSL certificates in ./ssl/
Loki, Promtail, and Grafana configurations in ./loki/

Installation & Deployment
1. Clone the repository
bashgit clone <repository-url>
cd <repository-directory>
2. Configure your environment
Modify the configuration files according to your environment needs:

Update backend environment variables in ./backend/.env
Configure database initialization in ./db/init.sql
Add your SSL certificates to ./ssl/

3. Start the application
bashdocker-compose up -d
This command will start all services in detached mode.
4. Monitor the deployment
bashdocker-compose ps
Access Points
After deployment, you can access:

Main Application: https://localhost (Port 80/443)
Grafana Dashboard: http://localhost:3000

Default credentials: admin/admin


Adminer (Database Admin): http://localhost:8080

Server: db
Username: appuser
Password: apppassword


Portainer (Docker Admin): http://localhost:9000
Loki API: http://localhost:3100

Resource Limits
The services have been configured with the following resource limits:

Backend services: 1 CPU, 512MB RAM
Monitoring services: 0.25-0.5 CPU, 128-256MB RAM

Logs
All application logs are collected by Promtail and stored in Loki, accessible through Grafana dashboards. Logs are also available through Docker's standard mechanisms:
bashdocker-compose logs -f [service_name]
Security Considerations

The backend network is internal and not accessible from outside
Containers have restricted capabilities using cap_drop and cap_add
The database uses strong authentication
No-new-privileges security option is enabled for critical services

Backup & Data Persistence
The following data is persisted through Docker volumes:

MySQL database: mysql_data
Portainer configuration: portainer_data
Loki logs: loki_data
Grafana dashboards and settings: grafana_data

To backup these volumes, use Docker's volume backup methods.
Maintenance
Scaling
To scale backend services:
bashdocker-compose up -d --scale backend=3
Updates
To update services:
bashdocker-compose pull
docker-compose up -d
Troubleshooting
Common issues:

Database connection issues: Ensure database is healthy with docker-compose ps db
Load balancer issues: Check Nginx logs with docker-compose logs loadbalancer
Monitoring issues: Verify Loki and Grafana are running properly
