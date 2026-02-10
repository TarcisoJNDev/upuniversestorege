const app = require("./app");

// NO RENDER, use APENAS process.env.PORT
const PORT = process.env.PORT || 3000; // Mude de 10000 para 3000

console.log("🚀 Iniciando servidor...");
console.log("📡 PORT:", PORT);
console.log("🌐 NODE_ENV:", process.env.NODE_ENV || "development");

// Garantir que a pasta uploads existe
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log("📁 Criando pasta uploads...");
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// REMOVA o "0.0.0.0" - deixe apenas a porta
app.listen(PORT, () => {
  console.log(`=======================================`);
  console.log(`🚀 API Universo Paralelo ONLINE`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL Externa: https://upuniversestorege.onrender.com`);
  console.log(`🏥 Health Check: /api/health`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log(`=======================================`);

  // Log para debug do Render
  console.log("\n🔧 Configuração Render:");
  console.log(`   RENDER: ${process.env.RENDER || "Não detectado"}`);
  console.log(
    `   RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || "Não configurado"}`,
  );
  console.log(
    `   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || "Não configurado"}`,
  );
});
