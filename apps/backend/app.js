const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { setupDatabase } = require("./src/config/database");
const productRoutes = require("./src/routes/productRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (para imagens, etc)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rotas
app.use("/api", productRoutes);

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API Universo Paralelo está funcionando!",
  });
});

const categoryRoutes = require("./src/routes/categoryRoutes");

app.use("/api", categoryRoutes);

// Inicializar banco de dados
setupDatabase().then(() => {
  console.log("Banco de dados pronto!");
});

module.exports = app;
