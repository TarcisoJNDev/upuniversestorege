// src/config/database-simple.js - VERSÃO COMPLETA
const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("🔌 Iniciando configuração Aiven MySQL...");

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
  connectTimeout: 30000,
  acquireTimeout: 30000,
};

const pool = mysql.createPool(poolConfig);

async function setupDatabase() {
  let connection;
  try {
    console.log("🔄 Iniciando setup completo do banco...");
    connection = await pool.getConnection();

    // 1. TABELA CATEGORIES (COMPLETA)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        icon VARCHAR(50) DEFAULT '🏷️',
        color VARCHAR(20) DEFAULT '#7C3AED',
        parent_id INT DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'active',
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Tabela 'categories' criada/verificada");

    // 2. TABELA PRODUCTS (COMPLETA)
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
        variants JSON,
        specifications JSON,
        shipping_info JSON,
        seo JSON,
        settings JSON,
        featured BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Tabela 'products' criada/verificada");

    // 3. TABELA ADMIN_USERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'admin_users' criada/verificada");

    // 4. TABELA PRODUCT_DRAFTS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_drafts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT,
        data JSON NOT NULL,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tabela 'product_drafts' criada/verificada");

    // 5. TABELA PRODUCT_CATEGORIES (MUITOS-PARA-MUITOS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tabela 'product_categories' criada/verificada");

    // 6. INSERIR ADMIN PADRÃO
    const [adminExists] = await connection.query(
      "SELECT id FROM admin_users WHERE email = ?",
      ["admin@universoparalelo.com"],
    );

    if (adminExists.length === 0) {
      await connection.query(
        "INSERT INTO admin_users (email, password, name) VALUES (?, ?, ?)",
        ["admin@universoparalelo.com", "admin123", "Administrador"],
      );
      console.log("👤 Usuário admin padrão criado");
    }

    // 7. INSERIR CATEGORIAS PADRÃO
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
        [
          "Protótipos",
          "prototipos",
          "Modelos e protótipos",
          "⚙️",
          "#2196F3",
          5,
        ],
      ];

      for (const cat of categories) {
        await connection.query(
          `INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
          cat,
        );
      }
      console.log("✅ 5 categorias padrão inseridas");
    }

    connection.release();
    console.log("🎉 Banco de dados configurado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ ERRO NO SETUP:", error);
    if (connection) connection.release();
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    console.log("✅ Teste de conexão: OK");
    return true;
  } catch (error) {
    console.error("❌ Teste de conexão falhou:", error);
    return false;
  }
}

module.exports = {
  pool,
  setupDatabase,
  testDatabaseConnection,
};
