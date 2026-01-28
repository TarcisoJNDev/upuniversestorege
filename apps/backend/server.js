const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Banco de dados: ${process.env.DB_NAME}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}/api/health`);
});
