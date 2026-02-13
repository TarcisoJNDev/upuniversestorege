// src/models/Category.js - ATUALIZADO
const { pool } = require("../config/database-simple");

class Category {
  constructor({
    id,
    name,
    slug,
    description,
    image_url,
    icon,
    color,
    parent_id,
    status,
    display_order,
    created_at,
    updated_at,
    product_count = 0, // Garantir que product_count tem valor padrão
  }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.description = description || "";
    this.image_url = image_url || "";
    this.icon = icon || "🏷️";
    this.color = color || "#7C3AED";
    this.parent_id = parent_id || null;
    this.status = status || "active";
    this.display_order = display_order || 0;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.product_count =
      product_count !== undefined && product_count !== null
        ? parseInt(product_count) || 0
        : 0; // ← CORREÇÃO AQUI
  }

  static fromDatabase(row) {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url: row.image_url,
      icon: row.icon,
      color: row.color,
      parent_id: row.parent_id,
      status: row.status,
      display_order: row.display_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product_count: row.product_count,
    });
  }

  // CORRIGIDO: Buscar categorias com contagem REAL de produtos
  // models/Category.js - CORREÇÃO DO MÉTODO findAllWithProductCount
  static async findAllWithProductCount(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `
      SELECT 
        c.*,
        COALESCE(COUNT(DISTINCT p.id), 0) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE 1=1
    `;

      const params = [];

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null || filters.parent_id === "") {
          query += " AND c.parent_id IS NULL";
        } else {
          query += " AND c.parent_id = ?";
          params.push(filters.parent_id);
        }
      }

      if (filters.status) {
        query += " AND c.status = ?";
        params.push(filters.status);
      }

      query +=
        " GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.icon, c.color, c.parent_id, c.status, c.display_order, c.created_at, c.updated_at";
      query += " ORDER BY c.display_order ASC, c.name ASC";

      console.log("📝 Query findAllWithProductCount:", query);
      console.log("📝 Parâmetros:", params);

      const [rows] = await connection.query(query, params);

      // Garantir que todas as colunas estão presentes
      const categories = rows.map((row) => {
        // Garantir que product_count existe
        if (row.product_count === undefined || row.product_count === null) {
          row.product_count = 0;
        }
        return this.fromDatabase(row);
      });

      return categories;
    } catch (error) {
      console.error("❌ Erro no findAllWithProductCount:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Método original para compatibilidade
  static async findAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT * FROM categories WHERE 1=1";
      const params = [];

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null || filters.parent_id === "") {
          query += " AND parent_id IS NULL";
        } else {
          query += " AND parent_id = ?";
          params.push(filters.parent_id);
        }
      }

      if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
      }

      query += " ORDER BY display_order ASC, name ASC";

      const [rows] = await connection.query(query, params);
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  // models/Category.js - Método create corrigido
  static async create(categoryData) {
    const connection = await pool.getConnection();
    try {
      console.log(
        "📥 Category.create - Dados recebidos:",
        JSON.stringify(categoryData, null, 2),
      );

      // Log da query ANTES de executar
      const query = `
      INSERT INTO categories 
      (name, slug, description, image_url, icon, color, parent_id, status, display_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      const params = [
        categoryData.name || "",
        categoryData.slug || "",
        categoryData.description || null,
        categoryData.image_url || null,
        categoryData.icon || "🏷️",
        categoryData.color || "#7C3AED",
        categoryData.parent_id || null,
        categoryData.status || "active",
        categoryData.display_order !== undefined
          ? categoryData.display_order
          : 0,
      ];

      console.log("📝 Query SQL:", query);
      console.log("📝 Parâmetros:", JSON.stringify(params, null, 2));

      const [result] = await connection.query(query, params);
      console.log("✅ Insert realizado, ID:", result.insertId);

      return result.insertId;
    } catch (error) {
      // LOG DETALHADO DO ERRO
      console.error("❌ ERRO NO SQL:");
      console.error("Código:", error.code);
      console.error("Errno:", error.errno);
      console.error("SQL State:", error.sqlState);
      console.error("SQL Message:", error.sqlMessage);
      console.error("Stack:", error.stack);
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM categories WHERE id = ?",
        [id],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  static async update(id, categoryData) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE categories SET 
          name = ?, slug = ?, description = ?, image_url = ?, 
          icon = ?, color = ?, parent_id = ?, status = ?, display_order = ?
         WHERE id = ?`,
        [
          categoryData.name,
          categoryData.slug,
          categoryData.description || "",
          categoryData.image_url || "",
          categoryData.icon || "🏷️",
          categoryData.color || "#7C3AED",
          categoryData.parent_id || null,
          categoryData.status || "active",
          categoryData.display_order || 1,
          id,
        ],
      );
      return true;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      // Primeiro, atualizar produtos que referenciam esta categoria
      await connection.query(
        "UPDATE products SET category_id = NULL WHERE category_id = ?",
        [id],
      );

      // Depois deletar a categoria
      await connection.query("DELETE FROM categories WHERE id = ?", [id]);
      return true;
    } finally {
      connection.release();
    }
  }

  static async findByName(name) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM categories WHERE name = ?",
        [name],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  static async findBySlug(slug) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM categories WHERE slug = ?",
        [slug],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  static async getProductsByCategoryId(categoryId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT p.* FROM products p 
         WHERE p.category_id = ? 
         ORDER BY p.created_at DESC`,
        [categoryId],
      );
      return rows;
    } finally {
      connection.release();
    }
  }
}

module.exports = Category;
