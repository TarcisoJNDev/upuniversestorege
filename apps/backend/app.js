const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Primeiro crie a aplicação Express
const app = express();

// DEBUG: Mostrar caminhos
console.log("=== CONFIGURAÇÃO DE CAMINHOS ===");
console.log("📁 __dirname:", __dirname);
console.log("📁 process.cwd():", process.cwd());

// CAMINHO CORRETO baseado no debug:
const UPLOADS_PATH = path.join(process.cwd(), "uploads");
console.log("📁 UPLOADS_PATH configurado:", UPLOADS_PATH);
console.log("📁 Pasta uploads existe?", fs.existsSync(UPLOADS_PATH));

if (fs.existsSync(UPLOADS_PATH)) {
  const files = fs.readdirSync(UPLOADS_PATH);
  console.log(`📁 ${files.length} arquivos encontrados em uploads`);
  if (files.length > 0) {
    console.log("📁 Exemplos:", files.slice(0, 3));
  }
}

// ========== CONFIGURAÇÃO CORS ESPECÍFICA PARA RENDER.COM ==========
const allowedOrigins = [
  "https://upuniverse-store.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

// Configuração principal CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sem origin (como mobile apps ou curl)
      if (!origin) return callback(null, true);

      // Verificar se a origem está na lista de permitidas
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`⚠️ Origem bloqueada: ${origin}`);
        callback(null, true); // Temporariamente permitir todas para debug
        // Em produção: callback(new Error('CORS não permitido para esta origem'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
      "X-Requested-With",
    ],
    exposedHeaders: [
      "Content-Length",
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "Access-Control-Allow-Origin",
    ],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

// Handler explícito para preflight OPTIONS
app.options("*", cors());

// Middleware para headers CORS adicionais
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Verificar se a origem está na lista de permitidas
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*"); // Fallback
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, X-Requested-With",
  );
  res.header(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type, Authorization, X-Request-ID, Access-Control-Allow-Origin",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");

  // Para requisições OPTIONS, responder imediatamente
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// ========== MIDDLEWARES ESSENCIAIS ==========
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log de todas as requisições (para debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log("Headers:", {
    origin: req.headers.origin,
    "user-agent": req.headers["user-agent"],
  });
  next();
});

// Servir arquivos estáticos
app.use(
  "/uploads",
  express.static(UPLOADS_PATH, {
    setHeaders: (res, filePath) => {
      const origin = req?.headers?.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
      } else {
        res.set("Access-Control-Allow-Origin", "*");
      }
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Credentials", "true");
      res.set("Cache-Control", "public, max-age=86400");
    },
  }),
);

// ========== IMPORTAR ROTAS ==========
const { setupDatabase } = require("./src/config/database-simple");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");

// ========== ROTAS DA API ==========
app.use("/api", productRoutes);
app.use("/api", categoryRoutes);

// Rota de health check aprimorada
app.get("/api/health", (req, res) => {
  const requestOrigin = req.headers.origin || "Sem origem";
  console.log(`✅ Health check acessado de: ${requestOrigin}`);

  res.json({
    status: "OK",
    message: "API Universo Paralelo está funcionando!",
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: requestOrigin,
      isAllowed:
        allowedOrigins.includes(requestOrigin) ||
        requestOrigin === "Sem origem",
    },
    uploadsPath: UPLOADS_PATH,
    uploadsExists: fs.existsSync(UPLOADS_PATH),
    uploadsFileCount: fs.existsSync(UPLOADS_PATH)
      ? fs.readdirSync(UPLOADS_PATH).length
      : 0,
    environment: process.env.NODE_ENV || "development",
    serverTime: new Date().toLocaleString("pt-BR"),
  });
});

// Rota para debug CORS
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS test successful",
    headers: {
      origin: req.headers.origin,
      "access-control-allow-origin": res.get("Access-Control-Allow-Origin"),
      "access-control-allow-methods": res.get("Access-Control-Allow-Methods"),
      "access-control-allow-headers": res.get("Access-Control-Allow-Headers"),
    },
    timestamp: new Date().toISOString(),
  });
});

// Rota para acessar uploads com CORS
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_PATH, filename);

  console.log(
    `🔍 Buscando imagem: ${filename} de origem: ${req.headers.origin}`,
  );

  if (fs.existsSync(filePath)) {
    console.log("✅ Encontrado, enviando...");

    // Adicionar headers CORS específicos
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Credentials", "true");

    res.sendFile(filePath);
  } else {
    console.log("❌ Não encontrado:", filePath);
    res.status(404).json({
      error: "Arquivo não encontrado",
      filename: filename,
      path: filePath,
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin,
    });
  }
});

// Rota catch-all para 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ========== INICIALIZAR BANCO DE DADOS ==========
setupDatabase()
  .then(() => {
    console.log("✅ Banco de dados pronto!");
    console.log(`✅ Uploads sendo servidos de: ${UPLOADS_PATH}`);
    console.log("✅ CORS configurado para origens:", allowedOrigins);
  })
  .catch((error) => {
    console.error("❌ Erro ao configurar banco de dados:", error);
  });

// ========== HANDLER DE ERROS ==========
app.use((err, req, res, next) => {
  console.error("❌ Erro na API:", err);

  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
    timestamp: new Date().toISOString(),
    path: req.path,
  });
});

module.exports = app;
