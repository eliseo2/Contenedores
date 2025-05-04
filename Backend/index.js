import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import helmet from "helmet";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: false // Añade cabeceras HTTP seguras
}));
app.use(cors({
  origin: [
    'https://localhost', 
    'http://localhost',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json()); // Para parsear JSON en el body



// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "appdb"
};

// Pool de conexiones a la base de datos
const pool = mysql.createPool(dbConfig);

// Middleware para verificar la conexión a la BD
app.use(async (req, res, next) => {
  try {
    req.db = await pool.getConnection();
    next();
  } catch (error) {
    console.error("Error conectando a la base de datos:", error);
    return res.status(500).json({ error: "Error de conexión a la base de datos" });
  }
});

// Añade esto antes de los otros endpoints
app.get("/", (req, res) => {
  res.json({
    message: "API en funcionamiento",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      test: "/api/getData"
    }
  });
});

// Endpoint 1: Obtener todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT id, username, email FROM users");
    req.db.release();
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Endpoint 2: Crear nuevo usuario (con validación)
app.post("/api/users", [
  body("username").isLength({ min: 3 }).trim().escape(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 })
], async (req, res) => {
  // Validar entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Usar consultas parametrizadas para evitar inyección SQL
    const [result] = await req.db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password] // En producción deberías hashear la contraseña
    );
    
    req.db.release();
    res.status(201).json({ 
      message: "Usuario creado correctamente", 
      userId: result.insertId 
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Endpoint 3: Obtener productos
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT * FROM products");
    req.db.release();
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// Endpoint original (mantener para compatibilidad)
app.get("/api/getData", (req, res) => {
    res.send("Hola desde el backend");
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor backend corriendo en puerto ${PORT}`));