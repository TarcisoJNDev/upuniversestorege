const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ========== CORS PARA RENDER ==========
const allowedOrigins = [
  "https://upuniverse-store.vercel.app",
  "https://upuniversestorege.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Middleware CORS principal
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sem origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`⚠️ Origem não permitida: ${origin}`);
        // Em produção, considere bloquear: callback(new Error('Not allowed by CORS'))
        callback(null, true); // Temporariamente permitir tudo
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  }),
);

// Middleware manual para garantir headers
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Origin, Accept",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Outros middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Caminhos
const UPLOADS_PATH = path.join(__dirname, "uploads");
console.log("📁 UPLOADS_PATH:", UPLOADS_PATH);

// Servir arquivos estáticos
app.use("/uploads", express.static(UPLOADS_PATH));

// ========== ROTAS ==========
// Health Check - SIMPLES E DIRETO
app.get("/api/health", (req, res) => {
  console.log("✅ Health check acessado de:", req.headers.origin);

  res.json({
    status: "online",
    service: "universo-paralelo-api",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || "none",
      isAllowed:
        !req.headers.origin || allowedOrigins.includes(req.headers.origin),
    },
  });
});

// Rota de teste CORS
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS test successful",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Importar outras rotas
const { setupDatabase } = require("./src/config/database-simple");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const cartRoutes = require("./src/routes/cartRoutes");

// Usar rotas
app.use("/api", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", cartRoutes); 

// Rota para uploads
app.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(UPLOADS_PATH, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Arquivo não encontrado" });
  }
});

// Rota raiz
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Universo Paralelo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .box { background: #f5f5f5; padding: 20px; border-radius: 10px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>🚀 API Universo Paralelo</h1>
        <p><strong>Status:</strong> ONLINE ✅</p>
        <p><strong>URL:</strong> https://upuniversestorege.onrender.com</p>
        <p><a href="/api/health">/api/health</a> - Health Check</p>
        <p><a href="/api/cors-test">/api/cors-test</a> - Teste CORS</p>
      </div>
    </body>
    </html>
  `);
});

// Inicializar banco
setupDatabase()
  .then(() => {
    console.log("✅ Banco de dados configurado");
  })
  .catch((error) => {
    console.error("❌ Erro no banco de dados:", error);
  });

// EXPORTE o app para o server.js usar
module.exports = app;
