const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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
    console.error(`Erro ao verificar coluna ${columnName}:`, error);
    return false;
  }
}

// Função para adicionar coluna se não existir
async function addColumnIfNotExists(connection, tableName, columnDefinition) {
  const columnMatch = columnDefinition.match(/^(\w+)/);
  const columnName = columnMatch ? columnMatch[1] : null;

  if (!columnName) {
    console.error(`Definição de coluna inválida: ${columnDefinition}`);
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
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    // Criar banco de dados se não existir
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`,
    );
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Criar tabela de produtos (versão base)
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tabela 'products' verificada/criada");

    // Verificar e adicionar novas colunas para o formulário com abas
    console.log("\n🔍 Verificando colunas da tabela products...");

    // Lista de novas colunas a serem adicionadas
    const newProductColumns = [
      // Colunas para Informações Básicas
      "short_description TEXT AFTER description",
      "promotional_price DECIMAL(10,2) AFTER price",
      "sku VARCHAR(100) AFTER category",

      // Colunas para armazenar dados complexos
      "variants JSON AFTER weight",
      "specifications JSON AFTER variants",
      "shipping_info JSON AFTER specifications",
      "seo JSON AFTER shipping_info",
      "settings JSON AFTER seo",
    ];

    // Adicionar cada coluna se não existir
    for (const columnDef of newProductColumns) {
      await addColumnIfNotExists(connection, "products", columnDef);
    }

    // Verificar estrutura atual da tabela
    console.log("\n📊 Estrutura atual da tabela products:");
    const [productColumns] = await connection.query(
      "SHOW COLUMNS FROM products",
    );

    productColumns.forEach((col) => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // ========== TABELA DE CATEGORIAS ==========
    console.log("\n🏷️ Configurando tabela de categorias...");

    // Criar tabela de categorias (versão base)
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
      // Coluna para ícone (emoji ou nome de ícone FontAwesome)
      "icon VARCHAR(50) AFTER image_url",
      // Coluna para cor do ícone
      "color VARCHAR(20) AFTER icon",
      // Coluna para status da categoria
      "status ENUM('active', 'inactive') DEFAULT 'active' AFTER parent_id",
      // Coluna para ordem de exibição (opcional)
      "display_order INT DEFAULT 0 AFTER status",
      // Coluna para atualização automática
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    ];

    console.log("🔍 Verificando colunas da tabela categories...");
    for (const columnDef of newCategoryColumns) {
      await addColumnIfNotExists(connection, "categories", columnDef);
    }

    // Verificar estrutura atual da tabela categories
    console.log("\n📊 Estrutura atual da tabela categories:");
    const [categoryColumns] = await connection.query(
      "SHOW COLUMNS FROM categories",
    );

    categoryColumns.forEach((col) => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

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

    // Inserir admin padrão (email: admin@universoparalelo.com, senha: admin123)
    const [adminExists] = await connection.query(
      "SELECT id FROM admin_users WHERE email = ?",
      ["admin@universoparalelo.com"],
    );

    if (adminExists.length === 0) {
      // Senha: admin123 (em produção usar bcrypt)
      await connection.query(
        "INSERT INTO admin_users (email, password, name) VALUES (?, ?, ?)",
        ["admin@universoparalelo.com", "admin123", "Administrador"],
      );
      console.log("👤 Usuário admin padrão criado");
    } else {
      console.log("👤 Usuário admin já existe");
    }

    // ========== TABELA DE RASCUNHOS DE PRODUTOS ==========
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

    // ========== TABELA DE PRODUTOS POR CATEGORIA (PARA RELACIONAMENTO MUITOS-PARA-MUITOS) ==========
    // Opcional: Se quiser que um produto possa ter múltiplas categorias
    console.log(
      "\n🔗 Configurando tabela de relacionamento produtos-categorias...",
    );

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
        {
          name: "Esculturas 3D",
          slug: "esculturas-3d",
          description:
            "Réplicas detalhadas e esculturas artísticas impressas em 3D",
          icon: "🏺",
          color: "#C084FC",
          status: "active",
          display_order: 1,
        },
        {
          name: "Decoração",
          slug: "decoracao",
          description:
            "Peças decorativas para casa, escritório e ambientes especiais",
          icon: "🏠",
          color: "#DF38FF",
          status: "active",
          display_order: 2,
        },
        {
          name: "Utilitários",
          slug: "utilitarios",
          description: "Objetos funcionais e práticos para uso no dia a dia",
          icon: "🔧",
          color: "#4CAF50",
          status: "active",
          display_order: 3,
        },
        {
          name: "Protótipos",
          slug: "prototipos",
          description: "Modelos e protótipos para desenvolvimento de produtos",
          icon: "⚙️",
          color: "#2196F3",
          status: "active",
          display_order: 4,
        },
        {
          name: "Brinquedos",
          slug: "brinquedos",
          description: "Brinquedos educativos e divertidos impressos em 3D",
          icon: "🧸",
          color: "#FFC107",
          status: "active",
          display_order: 5,
        },
      ];

      for (const category of defaultCategories) {
        await connection.query(
          `INSERT INTO categories (name, slug, description, icon, color, status, display_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            category.name,
            category.slug,
            category.description,
            category.icon,
            category.color,
            category.status,
            category.display_order,
          ],
        );
      }

      console.log(`✅ ${defaultCategories.length} categorias padrão inseridas`);
    } else {
      console.log(`⏭️ ${existingCategories[0].count} categorias já existem`);
    }

    // ========== VERIFICAR DADOS EXISTENTES ==========
    console.log("\n📦 Dados existentes:");

    const [productCount] = await connection.query(
      "SELECT COUNT(*) as count FROM products",
    );
    console.log(`  - Produtos: ${productCount[0].count}`);

    const [categoryCount] = await connection.query(
      "SELECT COUNT(*) as count FROM categories",
    );
    console.log(`  - Categorias: ${categoryCount[0].count}`);

    const [draftCount] = await connection.query(
      "SELECT COUNT(*) as count FROM product_drafts",
    );
    console.log(`  - Rascunhos: ${draftCount[0].count}`);

    await connection.end();

    console.log("\n🎉 Banco de dados configurado com sucesso!");
    console.log("📋 Todas as tabelas estão prontas para uso.");
    console.log("🏷️ Sistema de categorias completamente configurado!");
  } catch (error) {
    console.error("❌ Erro ao configurar banco de dados:", error);
    console.error("Detalhes:", error.message);
  }
}

// Função para testar conexão e estrutura
async function testDatabaseConnection() {
  try {
    console.log("🔌 Testando conexão com o banco de dados...");

    const connection = await pool.getConnection();

    // Testar consulta simples
    const [rows] = await connection.query("SELECT 1 as test");
    console.log("✅ Conexão com banco de dados funcionando");

    // Verificar versão do MySQL
    const [version] = await connection.query("SELECT VERSION() as version");
    console.log(`📊 Versão MySQL: ${version[0].version}`);

    // Verificar se as tabelas principais existem
    const tablesToCheck = ["products", "categories", "admin_users"];

    for (const tableName of tablesToCheck) {
      const [tables] = await connection.query(
        `SHOW TABLES LIKE '${tableName}'`,
      );

      if (tables.length > 0) {
        console.log(`✅ Tabela '${tableName}' existe`);

        // Verificar algumas colunas importantes
        if (tableName === "categories") {
          const [newColumns] = await connection.query(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = 'categories'
             AND COLUMN_NAME IN ('icon', 'color', 'status', 'display_order')`,
            [process.env.DB_NAME],
          );

          console.log(
            `🔍 Colunas de categoria encontradas: ${newColumns.length}`,
          );
          newColumns.forEach((col) => {
            console.log(`  - ${col.COLUMN_NAME}`);
          });
        }
      } else {
        console.log(`⚠️ Tabela '${tableName}' não encontrada`);
      }
    }

    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Erro na conexão com banco de dados:", error.message);
    return false;
  }
}

// Função para limpar e recriar banco (APENAS PARA DESENVOLVIMENTO!)
async function resetDatabase() {
  if (!process.env.DB_ALLOW_RESET || process.env.DB_ALLOW_RESET !== "true") {
    console.error(
      "❌ Reset de banco não permitido. Defina DB_ALLOW_RESET=true no .env",
    );
    return;
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("⚠️  APAGANDO E RECRIANDO BANCO DE DADOS...");

    // Apagar banco existente
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    console.log(`🗑️  Banco ${process.env.DB_NAME} apagado`);

    // Criar novo banco
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`🆕 Banco ${process.env.DB_NAME} criado`);

    await connection.end();

    // Executar setup normal
    await setupDatabase();

    console.log("♻️  Banco de dados reiniciado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao reiniciar banco:", error);
  }
}

// Função para criar uma categoria de teste (para desenvolvimento)
async function createTestCategory() {
  try {
    const connection = await pool.getConnection();

    const testCategory = {
      name: "Categoria Teste",
      slug: "categoria-teste-" + Date.now(),
      description: "Esta é uma categoria de teste criada automaticamente",
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

    console.log(`✅ Categoria de teste criada com ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error("❌ Erro ao criar categoria de teste:", error);
    return null;
  }
}

// Função para listar todas as categorias (para debug)
async function listCategories() {
  try {
    const connection = await pool.getConnection();

    const [categories] = await connection.query(
      "SELECT id, name, slug, icon, color, status, parent_id FROM categories ORDER BY display_order, name",
    );

    connection.release();

    console.log("\n📋 Lista de categorias:");
    console.log("ID | Nome | Slug | Ícone | Cor | Status | Pai");
    console.log("---|------|------|-------|-----|--------|-----");

    categories.forEach((cat) => {
      console.log(
        `${cat.id.toString().padEnd(2)} | ${cat.name.padEnd(20).substring(0, 20)} | ${cat.slug.padEnd(15).substring(0, 15)} | ${cat.icon.padEnd(3)} | ${cat.color.padEnd(7)} | ${cat.status.padEnd(6)} | ${cat.parent_id || "-"}`,
      );
    });

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
