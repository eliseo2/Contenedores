-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos datos de ejemplo
INSERT INTO users (username, email, password) VALUES 
('usuario1', 'usuario1@ejemplo.com', 'password123'),
('usuario2', 'usuario2@ejemplo.com', 'password123');

INSERT INTO products (name, description, price, stock) VALUES
('Producto 1', 'Descripción del producto 1', 19.99, 100),
('Producto 2', 'Descripción del producto 2', 29.99, 50),
('Producto 3', 'Descripción del producto 3', 39.99, 25);