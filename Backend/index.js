import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import helmet from "helmet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import winston from "winston";
import path from "path";
import { fileURLToPath } from 'url';

// Configurar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración avanzada de Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 15552000, // 180 días
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));

// Configuración de CORS
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

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    // Escribir logs de error a error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'error.log'), 
      level: 'error' 
    }),
    // Escribir logs de seguridad a security.log
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'security.log'), 
      level: 'warn' 
    }),
    // Escribir todos los logs a combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'combined.log') 
    }),
  ],
});

// En entorno de desarrollo, también loguear a la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Middleware para registrar solicitudes
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json()); // Para parsear JSON en el body

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Configurar rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 solicitudes por ventana
  standardHeaders: true, // Devuelve cabeceras estándar de RateLimit
  legacyHeaders: false, // Desactivar las cabeceras `X-RateLimit-*`
  message: { error: "Demasiadas solicitudes, por favor intente más tarde" }
});

// Aplicar rate limiting global a todas las rutas
app.use(globalLimiter);

// Rate limiting más estricto para endpoints sensibles
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limitar cada IP a 5 intentos de login por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de login. Por favor intenta más tarde." }
});

// Configuración mejorada del pool de conexiones MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "appdb",
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,     // Limitar número de conexiones
  queueLimit: 0,           // Sin límite en la cola de conexiones
  enableKeepAlive: true,   // Mantener conexiones activas
  keepAliveInitialDelay: 10000, // Delay inicial para keep-alive
  namedPlaceholders: true, // Usar placeholders con nombre para consultas más legibles
  // Configuración de TLS/SSL para conexiones seguras a la base de datos
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: true
  } : false
});

// Función de utilidad para registrar eventos de seguridad
const logSecurityEvent = (type, message, req) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  logger.warn({
    type,
    message,
    ip: clientIp,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Función de utilidad para consultas parametrizadas más seguras
const executeQuery = async (connection, query, params = []) => {
  try {
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    logger.error({
      type: 'query_error',
      query: query.substring(0, 100) + '...',  // No loguear la consulta completa
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error(`Error en consulta: ${error.message}`);
  }
};

// Middleware mejorado para gestionar conexiones y errores de DB
app.use(async (req, res, next) => {
  try {
    req.db = await pool.getConnection();
    
    // Asegurar que la conexión se libera al final de la solicitud
    res.on('finish', () => {
      if (req.db && !req.db.released) {
        req.db.release();
      }
    });
    
    next();
  } catch (error) {
    logger.error({
      type: 'db_connection_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: "Error de conexión a la base de datos" });
  }
});

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    logSecurityEvent('auth_failure', 'Token no proporcionado', req);
    return res.status(401).json({ error: "Se requiere autenticación" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logSecurityEvent('auth_failure', `Token inválido: ${err.message}`, req);
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    
    req.user = user;
    next();
  });
};

// Añade esto antes de los otros endpoints
app.get("/", (req, res) => {
  res.json({
    message: "API en funcionamiento",
    endpoints: {
      users: "/api/users",
      products: "/api/products",
      login: "/api/login",
      register: "/api/users"
    }
  });
});

// Endpoint: Login de usuario
app.post("/api/login", loginLimiter, [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  try {
    // Buscar usuario por email
    const users = await executeQuery(
      req.db,
      "SELECT id, username, email, password FROM users WHERE email = ?", 
      [email]
    );
    
    if (users.length === 0) {
      // Registrar intento fallido de login
      logSecurityEvent('login_failure', `Intento fallido para email: ${email}`, req);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    
    const user = users[0];
    
    // Verificar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      // Registrar intento fallido de login
      logSecurityEvent('login_failure', `Contraseña incorrecta para: ${email}`, req);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    
    // Generar JWT
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    const token = jwt.sign(
      userForToken, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Registrar login exitoso
    logger.info({
      type: 'login_success',
      userId: user.id,
      username: user.username,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({
      message: "Login exitoso",
      token,
      user: userForToken
    });
  } catch (error) {
    logger.error({
      type: 'login_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Error en el proceso de login" });
  }
});

// Endpoint: Obtener todos los usuarios (protegido)
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await executeQuery(
      req.db,
      "SELECT id, username, email FROM users"
    );
    res.json(users);
  } catch (error) {
    logger.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Endpoint: Crear nuevo usuario (registro)
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
    // Verificar si el email ya existe
    const existingUsers = await executeQuery(
      req.db,
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    
    // Generar hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Crear el nuevo usuario
    const result = await executeQuery(
      req.db,
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    
    logger.info({
      type: 'user_created',
      userId: result.insertId,
      username,
      email,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({ 
      message: "Usuario creado correctamente", 
      userId: result.insertId 
    });
  } catch (error) {
    logger.error({
      type: 'user_creation_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Endpoint: Obtener productos (protegido)
app.get("/api/products", authenticateToken, async (req, res) => {
  try {
    const products = await executeQuery(
      req.db,
      "SELECT * FROM products"
    );
    res.json(products);
  } catch (error) {
    logger.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// Endpoint: Ruta protegida de ejemplo
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ 
    message: "Ruta protegida", 
    user: req.user 
  });
});

// Endpoint original (mantener para compatibilidad)
app.get("/api/getData", (req, res) => {
  res.send("Hola desde el backend");
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  logger.error({
    type: 'server_error',
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Servidor backend corriendo en puerto ${PORT}`);
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});