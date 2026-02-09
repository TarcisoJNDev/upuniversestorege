// src/models/Category.js
const { pool } = require("../config/database");

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
    created_at,
    product_count = 0, // Nova propriedade
  }) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.description = description || "";
    this.image_url = image_url || "";
    this.icon = icon || "";
    this.color = color || "";
    this.parent_id = parent_id || null;
    this.status = status || "active";
    this.created_at = created_at;
    this.product_count = product_count; // Contagem de produtos
  }

  // Método estático para criar categoria a partir de dados do banco
  static fromDatabase(row) {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      image_url: row.image_url || "",
      icon: row.icon || "",
      color: row.color || "",
      parent_id: row.parent_id || null,
      status: row.status || "active",
      created_at: row.created_at,
      product_count: row.product_count || 0, // Adicionar contagem
    });
  }

  // Método para inserir no banco
  static async create(categoryData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO categories 
         (name, slug, description, image_url, icon, color, parent_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryData.name || "",
          categoryData.slug || "",
          categoryData.description || "",
          categoryData.image_url || "",
          categoryData.icon || "",
          categoryData.color || "",
          categoryData.parent_id || null,
          categoryData.status || "active",
        ],
      );
      return result.insertId;
    } finally {
      connection.release();
    }
  }

  // Buscar todas as categorias COM CONTAGEM DE PRODUTOS
  static async findAllWithProductCount(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `
        SELECT 
          c.*,
          COUNT(p.id) as product_count
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

      query += " GROUP BY c.id ORDER BY c.name ASC";

      const [rows] = await connection.query(query, params);
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  // Buscar todas as categorias (método original mantido para compatibilidade)
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

      query += " ORDER BY name ASC";

      const [rows] = await connection.query(query, params);
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  // Buscar categoria por ID
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

  // Buscar categoria por slug
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

  // Buscar categoria por nome
  static async findByName(name) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM categories WHERE name = ?",
        [name],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } catch (error) {
      console.error("Erro ao buscar categoria por nome:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Atualizar categoria
  static async update(id, categoryData) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `UPDATE categories SET 
          name = ?, slug = ?, description = ?, image_url = ?, 
          icon = ?, color = ?, parent_id = ?, status = ? 
         WHERE id = ?`,
        [
          categoryData.name || "",
          categoryData.slug || "",
          categoryData.description || "",
          categoryData.image_url || "",
          categoryData.icon || "",
          categoryData.color || "",
          categoryData.parent_id || null,
          categoryData.status || "active",
          id,
        ],
      );
      return true;
    } finally {
      connection.release();
    }
  }

  // Deletar categoria
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM categories WHERE id = ?", [id]);
      return true;
    } finally {
      connection.release();
    }
  }

  // Contar categorias
  static async count(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT COUNT(*) as total FROM categories WHERE 1=1";
      const params = [];

      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
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

      const [rows] = await connection.query(query, params);
      return rows[0].total;
    } finally {
      connection.release();
    }
  }

  // NOVOS MÉTODOS PARA TRABALHAR COM PRODUTOS

  // Buscar produtos por categoria ID
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
    } catch (error) {
      console.error("Erro ao buscar produtos por categoria:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Contar produtos por categoria ID
  static async countProductsByCategoryId(categoryId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
        [categoryId],
      );
      return rows[0].count;
    } catch (error) {
      console.error("Erro ao contar produtos por categoria:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Verificar se categoria pode ser excluída (não tem produtos)
  static async canDelete(categoryId) {
    const count = await this.countProductsByCategoryId(categoryId);
    return count === 0;
  }

  // Buscar categorias principais com contagem de produtos
  static async findMainCategoriesWithCount() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT 
          c.*,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        WHERE c.parent_id IS NULL
        GROUP BY c.id
        ORDER BY c.name ASC
      `);
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  // Buscar subcategorias com contagem de produtos
  static async findSubcategoriesWithCount(parentId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `
        SELECT 
          c.*,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        WHERE c.parent_id = ?
        GROUP BY c.id
        ORDER BY c.name ASC
      `,
        [parentId],
      );
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  // Buscar categorias com produtos ativos
  static async findAllWithProductCount(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.name = p.category  -- MUDE AQUI: c.name = p.category
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

      query += " GROUP BY c.id ORDER BY c.name ASC";

      const [rows] = await connection.query(query, params);
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }
}

module.exports = Category;
