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

// Middleware
app.use(
  cors({
    origin: [
      "https://upuniverse-store.vercel.app/",
      "http://localhost:3000",
      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos - CAMINHO CORRETO
app.use(
  "/uploads",
  express.static(UPLOADS_PATH, {
    setHeaders: (res, path) => {
      // Permitir CORS para imagens
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Cache-Control", "public, max-age=86400"); // Cache de 1 dia
    },
  }),
);

// Importações que dependem do app já criado
const { setupDatabase } = require("./src/config/database-simple");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");

// Rotas
app.use("/api", productRoutes);
app.use("/api", categoryRoutes);

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Universo Paralelo está funcionando!",
    timestamp: new Date().toISOString(),
    uploadsPath: UPLOADS_PATH,
    uploadsExists: fs.existsSync(UPLOADS_PATH),
    uploadsFileCount: fs.existsSync(UPLOADS_PATH)
      ? fs.readdirSync(UPLOADS_PATH).length
      : 0,
  });
});

// Rota para acessar uploads
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_PATH, filename);

  console.log(`🔍 Buscando imagem: ${filename}`);

  if (fs.existsSync(filePath)) {
    console.log("✅ Encontrado, enviando...");
    res.sendFile(filePath);
  } else {
    console.log("❌ Não encontrado:", filePath);
    res.status(404).json({
      error: "Arquivo não encontrado",
      filename: filename,
      path: filePath,
    });
  }
});

// Inicializar banco de dados
setupDatabase()
  .then(() => {
    console.log("✅ Banco de dados pronto!");
    console.log(`✅ Uploads sendo servidos de: ${UPLOADS_PATH}`);
  })
  .catch((error) => {
    console.error("❌ Erro ao configurar banco de dados:", error);
  });

module.exports = app;
