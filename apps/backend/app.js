const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Configuração para Render.com
const isRender =
  process.env.RENDER === "true" || process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

console.log("=== CONFIGURAÇÃO RENDER ===");
console.log("RENDER_EXTERNAL_URL:", process.env.RENDER_EXTERNAL_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", PORT);

// Caminhos
const UPLOADS_PATH = path.join(__dirname, "uploads");

// Criar pasta uploads se não existir
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
  console.log("📁 Pasta uploads criada");
}

// ========== CORS PARA RENDER ==========
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["https://upuniverse-store.vercel.app", "http://localhost:3000"];

  const origin = req.headers.origin;

  // Permitir origens específicas
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (origin && isRender) {
    // No Render, permitir qualquer origem em desenvolvimento
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");

  // Log para debug
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${origin || "none"}`);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos
app.use(
  "/uploads",
  express.static(UPLOADS_PATH, {
    setHeaders: (res, path) => {
      res.set("Cache-Control", "public, max-age=86400");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// ========== ROTAS ==========
// Health check com headers explícitos
app.get("/api/health", (req, res) => {
  console.log("🏥 Health check - Headers:", req.headers);

  res.json({
    status: "online",
    service: "universo-paralelo-api",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    render: isRender,
    cors: {
      allowedOrigin: res.getHeader("Access-Control-Allow-Origin"),
      requestOrigin: req.headers.origin,
      allowedMethods: res.getHeader("Access-Control-Allow-Methods"),
    },
  });
});

// Teste CORS
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS funcionando!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Importar outras rotas
const { setupDatabase } = require("./src/config/database-simple");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");

app.use("/api", productRoutes);
app.use("/api", categoryRoutes);

// Rota para arquivos
app.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(UPLOADS_PATH, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Arquivo não encontrado" });
  }
});

// Inicializar banco
setupDatabase()
  .then(() => console.log("✅ Banco de dados inicializado"))
  .catch((err) => console.error("❌ Erro no banco:", err));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 Servidor iniciado!
📡 Porta: ${PORT}
🌐 Ambiente: ${process.env.NODE_ENV || "development"}
🔗 Render: ${isRender ? "Sim" : "Não"}
📁 Uploads: ${UPLOADS_PATH}
  `);
});

module.exports = app;
