// src/config/database-simple.js - VERSÃO COMPLETA CORRIGIDA
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

// ============================================
// FUNÇÃO PARA CORRIGIR A FOREIGN KEY DO AIVEN
// ============================================
async function fixCategoryForeignKey(connection) {
  try {
    console.log(
      "🔧 Verificando e corrigindo foreign key da tabela categories...",
    );

    // 1. Verificar se a tabela existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'categories'");

    if (tables.length === 0) {
      console.log(
        "⏭️ Tabela categories não existe ainda, vai ser criada depois",
      );
      return;
    }

    // 2. Verificar constraints existentes
    const [constraints] = await connection.query(
      `SELECT CONSTRAINT_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'categories' 
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [process.env.DB_NAME],
    );

    // 3. Remover todas as foreign keys da tabela categories
    for (const constraint of constraints) {
      try {
        await connection.query(
          `ALTER TABLE categories DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`,
        );
        console.log(`✅ Foreign key ${constraint.CONSTRAINT_NAME} removida`);
      } catch (dropError) {
        console.log(
          `⚠️ Não foi possível remover ${constraint.CONSTRAINT_NAME}:`,
          dropError.message,
        );
      }
    }

    // 4. Modificar a coluna parent_id para garantir que aceita NULL
    try {
      await connection.query(`
        ALTER TABLE categories 
        MODIFY COLUMN parent_id INT DEFAULT NULL
      `);
      console.log("✅ Coluna parent_id modificada com sucesso");
    } catch (modifyError) {
      console.log(
        "⚠️ Não foi possível modificar parent_id:",
        modifyError.message,
      );
    }

    // 5. Recriar a foreign key com nome específico
    try {
      await connection.query(`
        ALTER TABLE categories 
        ADD CONSTRAINT fk_category_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL
      `);
      console.log("✅ Foreign key fk_category_parent criada com sucesso");
    } catch (addError) {
      // Se já existir, ignorar
      if (!addError.message.includes("Duplicate")) {
        console.error("❌ Erro ao criar foreign key:", addError.message);
      } else {
        console.log("⏭️ Foreign key fk_category_parent já existe");
      }
    }

    console.log("✅ Verificação de foreign key concluída");
  } catch (error) {
    console.error("❌ Erro ao corrigir foreign key:", error);
  }
}

async function setupDatabase() {
  let connection;
  try {
    console.log("🔄 Iniciando setup completo do banco...");
    connection = await pool.getConnection();

    // ============================================
    // 1. TABELA CATEGORIES - COM CRIAÇÃO SEGURA
    // ============================================
    console.log("📦 Criando/verificando tabela categories...");

    // Primeiro criar a tabela SEM a foreign key
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela 'categories' criada/verificada (sem FK)");

    // Agora aplicar a correção da foreign key
    await fixCategoryForeignKey(connection);

    // ============================================
    // 2. TABELA PRODUCTS
    // ============================================
    console.log("📦 Criando/verificando tabela products...");
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

    // ============================================
    // 3. TABELA ADMIN_USERS
    // ============================================
    console.log("📦 Criando/verificando tabela admin_users...");
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

    // ============================================
    // 4. TABELA PRODUCT_DRAFTS
    // ============================================
    console.log("📦 Criando/verificando tabela product_drafts...");
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

    // ============================================
    // 5. TABELA PRODUCT_CATEGORIES
    // ============================================
    console.log("📦 Criando/verificando tabela product_categories...");
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

    // ============================================
    // 6. TABELA CARTS (NOVA)
    // ============================================
    console.log("🛒 Criando/verificando tabela carts...");
    await connection.query(`
  CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    items JSON,
    total DECIMAL(10,2) DEFAULT 0,
    count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
  )
`);
    console.log("✅ Tabela 'carts' criada/verificada");

    // ============================================
    // 6. INSERIR ADMIN PADRÃO
    // ============================================
    console.log("👤 Verificando admin padrão...");
    const [adminExists] = await connection.query(
      "SELECT id FROM admin_users WHERE email = ?",
      ["admin@universoparalelo.com"],
    );

    if (adminExists.length === 0) {
      await connection.query(
        "INSERT INTO admin_users (email, password, name) VALUES (?, ?, ?)",
        ["admin@universoparalelo.com", "admin123", "Administrador"],
      );
      console.log("✅ Usuário admin padrão criado");
    } else {
      console.log("⏭️ Usuário admin já existe");
    }

    // ============================================
    // 7. INSERIR CATEGORIAS PADRÃO (SE NECESSÁRIO)
    // ============================================
    console.log("🏷️ Verificando categorias padrão...");
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
          `INSERT INTO categories (name, slug, description, icon, color, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          cat,
        );
      }
      console.log(`✅ ${categories.length} categorias padrão inseridas`);
    } else {
      console.log(`⏭️ ${catCount[0].count} categorias já existem`);
    }

    // ============================================
    // 8. VERIFICAÇÃO FINAL
    // ============================================
    console.log("\n🔍 Verificando estrutura final...");

    // Verificar se a foreign key está funcionando
    try {
      const [fkCheck] = await connection.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'categories' 
         AND CONSTRAINT_NAME = 'fk_category_parent'`,
        [process.env.DB_NAME],
      );

      if (fkCheck.length > 0) {
        console.log("✅ Foreign key fk_category_parent está ativa");
      } else {
        console.log("⚠️ Foreign key fk_category_parent não encontrada");
      }
    } catch (checkError) {
      console.error("❌ Erro ao verificar foreign key:", checkError.message);
    }

    connection.release();
    console.log("\n🎉 Banco de dados configurado com sucesso!");
    console.log("📊 Tabelas criadas/verificadas:");
    console.log("   - categories");
    console.log("   - products");
    console.log("   - admin_users");
    console.log("   - product_drafts");
    console.log("   - product_categories");

    return true;
  } catch (error) {
    console.error("\n❌ ERRO NO SETUP DO BANCO:", error);
    console.error("Detalhes:", error.message);
    if (error.code) console.error("Código:", error.code);
    if (error.sqlState) console.error("SQL State:", error.sqlState);
    if (error.sqlMessage) console.error("SQL Message:", error.sqlMessage);

    if (connection) {
      try {
        connection.release();
      } catch (e) {}
    }
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log("🧪 Testando conexão com o banco...");
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");

    // Testar se a foreign key está funcionando
    try {
      const [fkTest] = await connection.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'categories' 
         AND CONSTRAINT_NAME = 'fk_category_parent'`,
        [process.env.DB_NAME],
      );

      if (fkTest.length > 0) {
        console.log("✅ Foreign key fk_category_parent OK");
      }
    } catch (fkError) {
      console.log("⚠️ Não foi possível verificar foreign key");
    }

    connection.release();
    console.log("✅ Teste de conexão: OK");
    return true;
  } catch (error) {
    console.error("❌ Teste de conexão falhou:", error.message);
    return false;
  }
}

// Adicione esta função TEMPORÁRIA no database-simple.js
async function forceResetCategories() {
  let connection;
  try {
    console.log("⚠️ FORÇANDO RESET DA TABELA CATEGORIES...");
    connection = await pool.getConnection();

    // Drop da tabela categories (e suas dependências)
    await connection.query("DROP TABLE IF EXISTS product_categories");
    await connection.query("DROP TABLE IF EXISTS products");
    await connection.query("DROP TABLE IF EXISTS categories");

    console.log("✅ Tabelas removidas");

    // Recriar categories DO ZERO
    await connection.query(`
      CREATE TABLE categories (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabela categories recriada");

    // Recriar foreign key DEPOIS
    await connection.query(`
      ALTER TABLE categories 
      ADD CONSTRAINT fk_category_parent 
      FOREIGN KEY (parent_id) 
      REFERENCES categories(id) 
      ON DELETE SET NULL
    `);
    console.log("✅ Foreign key recriada");

    // Inserir categorias padrão
    const categories = [
      [
        "Esculturas 3D",
        "esculturas-3d",
        "Réplicas detalhadas",
        "🏺",
        "#C084FC",
        1,
      ],
      ["Decoração", "decoracao", "Peças decorativas", "🏠", "#DF38FF", 2],
      ["Utilitários", "utilitarios", "Objetos funcionais", "🔧", "#4CAF50", 3],
      ["Brinquedos", "brinquedos", "Brinquedos educativos", "🧸", "#FFC107", 4],
    ];

    for (const cat of categories) {
      await connection.query(
        `INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?)`,
        cat,
      );
    }
    console.log("✅ Categorias padrão inseridas");

    // Recriar tabela products (simplificada para teste)
    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INT,
        stock INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Tabela products recriada");

    connection.release();
    console.log("🎉 RESET CONCLUÍDO!");
    return true;
  } catch (error) {
    console.error("❌ Erro no reset:", error);
    if (connection) connection.release();
    return false;
  }
}

// ============================================
// FUNÇÃO PARA REINICIAR O BANCO (APENAS DEV)
// ============================================
async function resetDatabase() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Reset de banco não permitido em produção!");
    return false;
  }

  let connection;
  try {
    console.log("⚠️ REINICIANDO BANCO DE DADOS...");
    connection = await pool.getConnection();

    // Drop das tabelas na ordem correta
    await connection.query("DROP TABLE IF EXISTS product_categories");
    await connection.query("DROP TABLE IF EXISTS product_drafts");
    await connection.query("DROP TABLE IF EXISTS products");
    await connection.query("DROP TABLE IF EXISTS categories");
    await connection.query("DROP TABLE IF EXISTS admin_users");

    console.log("🗑️ Todas as tabelas foram removidas");
    connection.release();

    // Recriar tudo
    return await setupDatabase();
  } catch (error) {
    console.error("❌ Erro ao reiniciar banco:", error);
    if (connection) connection.release();
    return false;
  }
}

module.exports = {
  pool,
  setupDatabase,
  testDatabaseConnection,
  resetDatabase, // Exportar também a função de reset
};

// forceResetCategories().then(() => console.log("Reset executado"));
