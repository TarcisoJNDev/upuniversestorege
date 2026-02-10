const app = require("./app");

// Usar porta do Render ou 10000
const PORT = process.env.PORT || 10000;

// Garantir que a pasta uploads existe
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log("📁 Criando pasta uploads...");
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API Universo Paralelo rodando na porta ${PORT}`);
  console.log(`📁 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Uploads: ${uploadsDir}`);

  // Verificar variáveis de ambiente
  console.log("\n🔧 Variáveis de ambiente:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `   DB_HOST: ${process.env.DB_HOST ? "✓ Configurado" : "✗ Não configurado"}`,
  );
  console.log(
    `   DB_NAME: ${process.env.DB_NAME ? "✓ Configurado" : "✗ Não configurado"}`,
  );
});
