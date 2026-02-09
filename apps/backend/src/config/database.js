// src/config/database.js - VERSÃO AIVEN COMPATÍVEL
const mysql = require("mysql2/promise");
require("dotenv").config();

// DEBUG: Mostrar configuração (sem senha completa)
console.log("🔌 Configurando MySQL Aiven...");
console.log("📊 Configuração:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  hasPassword: !!process.env.DB_PASSWORD,
  nodeEnv: process.env.NODE_ENV,
});

// CONFIGURAÇÃO DO POOL COM SSL PARA AIVEN
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // SSL OBRIGATÓRIO PARA AIVEN
  ssl: {
    rejectUnauthorized: true,
  },

  // Timeouts aumentados para conexões remotas
  connectTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 30000,
};

const pool = mysql.createPool(poolConfig);

// Função para verificar se uma coluna existe
async function columnExists(connection, tableName, columnName) {
  try {
    const [rows] = await connection.query(
      `SELECT * FROM information_schema.columns 
       WHERE table_schema = ? 
       AND table_name = ? 
       AND column_name = ?`,
      [process.env.DB_NAME, tableName, columnName],
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`❌ Erro ao verificar coluna ${columnName}:`, error.message);
    return false;
  }
}

// Função para adicionar coluna se não existir
async function addColumnIfNotExists(connection, tableName, columnDefinition) {
  const columnMatch = columnDefinition.match(/^(\w+)/);
  const columnName = columnMatch ? columnMatch[1] : null;

  if (!columnName) {
    console.error(`❌ Definição de coluna inválida: ${columnDefinition}`);
    return;
  }

  const exists = await columnExists(connection, tableName, columnName);

  if (!exists) {
    try {
      await connection.query(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`,
      );
      console.log(`✅ Coluna ${columnName} adicionada à tabela ${tableName}`);
    } catch (error) {
      console.error(
        `❌ Erro ao adicionar coluna ${columnName}:`,
        error.message,
      );
    }
  } else {
    console.log(`⏭️ Coluna ${columnName} já existe na tabela ${tableName}`);
  }
}

// Função para criar o banco e tabelas se não existirem
async function setupDatabase() {
  let connection;
  try {
    console.log("🏗️  Iniciando configuração do banco Aiven...");

    // Testar conexão primeiro
    const testConn = await pool.getConnection();
    await testConn.query("SELECT 1 as test");
    testConn.release();
    console.log("✅ Conexão com Aiven MySQL estabelecida");

    connection = await pool.getConnection();

    // O Aiven já cria o banco 'defaultdb', então não precisamos criar
    console.log(`📁 Usando banco: ${process.env.DB_NAME}`);

    // ========== TABELA DE CATEGORIAS (PRIMEIRO - PARA FOREIGN KEY) ==========
    console.log("\n🏷️ Configurando tabela de categorias...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'categories' verificada/criada");

    // Verificar e adicionar novas colunas para categorias
    const newCategoryColumns = [
      "icon VARCHAR(50) AFTER image_url",
      "color VARCHAR(20) AFTER icon",
      "status ENUM('active', 'inactive') DEFAULT 'active' AFTER parent_id",
      "display_order INT DEFAULT 0 AFTER status",
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    ];

    console.log("🔍 Verificando colunas da tabela categories...");
    for (const columnDef of newCategoryColumns) {
      await addColumnIfNotExists(connection, "categories", columnDef);
    }

    // ========== TABELA DE PRODUTOS ==========
    console.log("\n📦 Configurando tabela de produtos...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        image_url VARCHAR(500),
        images JSON,
        material VARCHAR(100),
        dimensions VARCHAR(100),
        weight VARCHAR(50),
        featured BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        category_id INT DEFAULT NULL
        -- FOREIGN KEY será adicionada depois que a tabela categories existir
      )
    `);
    console.log("✅ Tabela 'products' verificada/criada");

    // Verificar e adicionar novas colunas para produtos
    console.log("\n🔍 Verificando colunas da tabela products...");
    const newProductColumns = [
      "short_description TEXT AFTER description",
      "promotional_price DECIMAL(10,2) AFTER price",
      "sku VARCHAR(100) AFTER category",
      "variants JSON AFTER weight",
      "specifications JSON AFTER variants",
      "shipping_info JSON AFTER specifications",
      "seo JSON AFTER shipping_info",
      "settings JSON AFTER seo",
    ];

    for (const columnDef of newProductColumns) {
      await addColumnIfNotExists(connection, "products", columnDef);
    }

    // Adicionar FOREIGN KEY depois que ambas as tabelas existem
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL
      `);
      console.log("✅ Foreign key adicionada à tabela products");
    } catch (error) {
      console.log(
        "⏭️ Foreign key já existe ou não pôde ser adicionada:",
        error.message,
      );
    }

    // ========== TABELA DE USUÁRIOS ADMIN ==========
    console.log("\n👤 Configurando tabela de administradores...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'admin_users' verificada/criada");

    // Inserir admin padrão
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
    } else {
      console.log("👤 Usuário admin já existe");
    }

    // ========== TABELA DE RASCUNHOS ==========
    console.log("\n📝 Configurando tabela de rascunhos...");

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
    console.log("✅ Tabela 'product_drafts' verificada/criada");

    // ========== TABELA DE RELACIONAMENTO ==========
    console.log("\n🔗 Configurando tabela de relacionamento...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tabela 'product_categories' verificada/criada");

    // ========== INSERIR CATEGORIAS PADRÃO ==========
    console.log("\n🏷️ Verificando categorias padrão...");

    const [existingCategories] = await connection.query(
      "SELECT COUNT(*) as count FROM categories",
    );

    if (existingCategories[0].count === 0) {
      console.log("📝 Inserindo categorias padrão...");

      const defaultCategories = [
        [
          "Esculturas 3D",
          "esculturas-3d",
          "Réplicas detalhadas impressas em 3D",
          "🏺",
          "#C084FC",
          "active",
          1,
        ],
        [
          "Decoração",
          "decoracao",
          "Peças decorativas para casa",
          "🏠",
          "#DF38FF",
          "active",
          2,
        ],
        [
          "Utilitários",
          "utilitarios",
          "Objetos funcionais",
          "🔧",
          "#4CAF50",
          "active",
          3,
        ],
        [
          "Brinquedos",
          "brinquedos",
          "Brinquedos educativos",
          "🧸",
          "#FFC107",
          "active",
          4,
        ],
      ];

      for (const cat of defaultCategories) {
        await connection.query(
          `INSERT INTO categories (name, slug, description, icon, color, status, display_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          cat,
        );
      }
      console.log(`✅ ${defaultCategories.length} categorias padrão inseridas`);
    } else {
      console.log(`⏭️ ${existingCategories[0].count} categorias já existem`);
    }

    // ========== VERIFICAR ESTRUTURAS FINAIS ==========
    console.log("\n📊 Estrutura final das tabelas:");

    const tables = ["categories", "products", "admin_users"];
    for (const table of tables) {
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`\n📋 ${table.toUpperCase()} (${columns.length} colunas):`);
      columns.forEach((col) => {
        console.log(
          `  - ${col.Field.padEnd(25)} ${col.Type.padEnd(30)} ${col.Null === "YES" ? "NULL" : "NOT NULL"}`,
        );
      });
    }

    connection.release();

    console.log("\n🎉 Banco de dados Aiven configurado com sucesso!");
    console.log("📋 Todas as tabelas estão prontas para uso.");
    return true;
  } catch (error) {
    console.error("❌ Erro ao configurar banco de dados Aiven:", error.message);
    console.error("🔧 Detalhes:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });

    if (connection) {
      try {
        connection.release();
      } catch (e) {}
    }
    return false;
  }
}

// Função para testar conexão
async function testDatabaseConnection() {
  try {
    console.log("🔌 Testando conexão com Aiven MySQL...");

    const connection = await pool.getConnection();

    // Testar consulta simples
    const [rows] = await connection.query(
      "SELECT 1 as test, VERSION() as version",
    );
    console.log("✅ Conexão com Aiven MySQL funcionando");
    console.log(`📊 Versão MySQL: ${rows[0].version}`);

    // Verificar tabelas
    const [tables] = await connection.query("SHOW TABLES");
    console.log(`📋 ${tables.length} tabelas encontradas:`);
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão com Aiven MySQL:", error.message);
    console.error("🔧 Detalhes técnicos:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
    });
    return false;
  }
}

// Funções auxiliares (mantidas para compatibilidade)
async function resetDatabase() {
  console.error("❌ Reset de banco não disponível em produção Aiven");
  return false;
}

async function createTestCategory() {
  try {
    const connection = await pool.getConnection();

    const testCategory = {
      name: "Categoria Teste Aiven",
      slug: "categoria-teste-aiven-" + Date.now(),
      description: "Categoria de teste criada no Aiven",
      icon: "🧪",
      color: "#7C3AED",
      status: "active",
      display_order: 99,
    };

    const [result] = await connection.query(
      `INSERT INTO categories (name, slug, description, icon, color, status, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        testCategory.name,
        testCategory.slug,
        testCategory.description,
        testCategory.icon,
        testCategory.color,
        testCategory.status,
        testCategory.display_order,
      ],
    );

    connection.release();

    console.log(
      `✅ Categoria de teste criada no Aiven com ID: ${result.insertId}`,
    );
    return result.insertId;
  } catch (error) {
    console.error("❌ Erro ao criar categoria de teste:", error);
    return null;
  }
}

async function listCategories() {
  try {
    const connection = await pool.getConnection();

    const [categories] = await connection.query(
      "SELECT id, name, slug, icon, color, status, parent_id FROM categories ORDER BY display_order, name",
    );

    connection.release();

    console.log("\n📋 Lista de categorias no Aiven:");
    console.log("=".repeat(80));
    categories.forEach((cat, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${cat.name.padEnd(25)} | ${cat.slug.padEnd(20)} | ${cat.icon} | ${cat.color}`,
      );
    });
    console.log("=".repeat(80));

    return categories;
  } catch (error) {
    console.error("❌ Erro ao listar categorias:", error);
    return [];
  }
}

module.exports = {
  pool,
  setupDatabase,
  testDatabaseConnection,
  resetDatabase,
  createTestCategory,
  listCategories,
};
