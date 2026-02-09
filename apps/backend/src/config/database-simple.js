// src/config/database-simple.js - VERSÃO ULTRA SIMPLIFICADA
const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("🔌 Iniciando configuração Aiven MySQL...");
console.log("📊 Config Aiven:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  hasPassword: !!process.env.DB_PASSWORD,
});

// CONFIGURAÇÃO SIMPLES PARA AIVEN
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,

  // SSL OBRIGATÓRIO
  ssl: {
    rejectUnauthorized: true,
  },

  // Timeouts
  connectTimeout: 30000,
  acquireTimeout: 30000,
};

const pool = mysql.createPool(poolConfig);

// FUNÇÃO PRINCIPAL - SETUP SIMPLIFICADO
async function setupDatabase() {
  let connection;
  try {
    console.log("🔄 Iniciando setup do banco...");

    // 1. Testar conexão básica
    connection = await pool.getConnection();
    console.log("✅ Conexão com Aiven estabelecida");

    // 2. Testar query simples
    const [testResult] = await connection.query(
      "SELECT 1 as test, VERSION() as version",
    );
    console.log(`✅ MySQL versão: ${testResult[0].version}`);

    // 3. Criar tabelas básicas se não existirem
    console.log("📝 Criando tabelas básicas...");

    // Tabela categories (simples)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        icon VARCHAR(50) DEFAULT '🏷️',
        color VARCHAR(20) DEFAULT '#7C3AED',
        status VARCHAR(20) DEFAULT 'active',
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'categories' pronta");

    // Tabela products (simples)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        promotional_price DECIMAL(10, 2),
        category VARCHAR(100),
        category_id INT,
        stock INT DEFAULT 0,
        sku VARCHAR(100),
        image_url VARCHAR(500),
        images JSON,
        material VARCHAR(100),
        dimensions VARCHAR(100),
        weight VARCHAR(50),
        featured BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'products' pronta");

    // 4. Verificar/inserir categorias padrão
    const [catCount] = await connection.query(
      "SELECT COUNT(*) as count FROM categories",
    );
    if (catCount[0].count === 0) {
      console.log("📝 Inserindo categorias padrão...");

      const categories = [
        [
          "Esculturas 3D",
          "esculturas-3d",
          "Réplicas detalhadas impressas em 3D",
          "🏺",
          "#C084FC",
          1,
        ],
        [
          "Decoração",
          "decoracao",
          "Peças decorativas para casa",
          "🏠",
          "#DF38FF",
          2,
        ],
        [
          "Utilitários",
          "utilitarios",
          "Objetos funcionais",
          "🔧",
          "#4CAF50",
          3,
        ],
        [
          "Brinquedos",
          "brinquedos",
          "Brinquedos educativos",
          "🧸",
          "#FFC107",
          4,
        ],
      ];

      for (const cat of categories) {
        await connection.query(
          `INSERT INTO categories (name, slug, description, icon, color, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          cat,
        );
      }
      console.log("✅ 4 categorias inseridas");
    }

    // 5. Liberar conexão
    connection.release();
    console.log("🎉 Setup do banco concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ ERRO NO SETUP:", error.message);
    console.error("🔧 Código:", error.code);
    console.error("🔧 SQL State:", error.sqlState);

    if (connection) {
      try {
        connection.release();
      } catch (e) {}
    }
    return false;
  }
}

// Função de teste simples
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("SELECT 1 as test");
    connection.release();
    console.log("✅ Teste de conexão: OK");
    return true;
  } catch (error) {
    console.error("❌ Teste de conexão falhou:", error.message);
    return false;
  }
}

module.exports = {
  pool,
  setupDatabase,
  testDatabaseConnection,
};
