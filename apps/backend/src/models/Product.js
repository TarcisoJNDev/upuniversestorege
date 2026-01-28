// src/models/Product.js
const { pool } = require("../config/database");

class Product {
  constructor({
    id,
    name,
    description,
    short_description,
    price,
    promotional_price,
    category,
    stock,
    sku,
    image_url,
    images,
    material,
    dimensions,
    weight,
    variants,
    specifications,
    shipping_info,
    seo,
    settings,
    featured,
    status,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.name = name;
    this.description = description || "";
    this.short_description = short_description || "";
    this.price = price || 0;
    this.promotional_price = promotional_price || null;
    this.category = category || "";
    this.stock = stock || 0;
    this.sku = sku || "";
    this.image_url = image_url || "";
    this.images = images || [];
    this.material = material || "";
    this.dimensions = dimensions || "";
    this.weight = weight || "";
    this.variants = variants || {};
    this.specifications = specifications || [];
    this.shipping_info = shipping_info || {};
    this.seo = seo || {};
    this.settings = settings || {};
    this.featured = featured || false;
    this.status = status || "active";
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Método estático para criar produto a partir de dados do banco
  static fromDatabase(row) {
    // Função auxiliar para parsear JSON com segurança
    const safeParse = (data, defaultValue) => {
      try {
        if (!data) return defaultValue;
        if (typeof data === "string") {
          return JSON.parse(data);
        }
        return data;
      } catch (error) {
        console.warn(`Aviso: Não foi possível parsear JSON`, error);
        return defaultValue;
      }
    };

    // Processar imagens
    let images = [];
    try {
      if (row.images) {
        if (Array.isArray(row.images)) {
          images = row.images;
        } else if (typeof row.images === "string") {
          images = safeParse(row.images, []);
        }
      }
    } catch (error) {
      console.warn(
        "Aviso: Não foi possível parsear images para produto",
        row.id,
        error,
      );
      images = [];
    }

    // Garantir que featured seja boolean
    const featured =
      row.featured === 1 || row.featured === true || row.featured === "1";

    return new Product({
      id: row.id,
      name: row.name,
      description: row.description || "",
      short_description: row.short_description || "",
      price: parseFloat(row.price) || 0,
      promotional_price: row.promotional_price
        ? parseFloat(row.promotional_price)
        : null,
      category: row.category || "",
      stock: parseInt(row.stock) || 0,
      sku: row.sku || "",
      image_url: row.image_url || "",
      images: images,
      material: row.material || "",
      dimensions: row.dimensions || "",
      weight: row.weight || "",
      variants: safeParse(row.variants, {}),
      specifications: safeParse(row.specifications, []),
      shipping_info: safeParse(row.shipping_info, {}),
      seo: safeParse(row.seo, {}),
      settings: safeParse(row.settings, {}),
      featured: featured,
      status: row.status || "active",
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  // Método para inserir no banco
  static async create(productData) {
    const connection = await pool.getConnection();
    try {
      // Preparar dados
      const images = Array.isArray(productData.images)
        ? JSON.stringify(productData.images)
        : "[]";

      const variants = productData.variants
        ? JSON.stringify(productData.variants)
        : "{}";

      const specifications = productData.specifications
        ? JSON.stringify(productData.specifications)
        : "[]";

      const shipping_info = productData.shipping_info
        ? JSON.stringify(productData.shipping_info)
        : "{}";

      const seo = productData.seo ? JSON.stringify(productData.seo) : "{}";

      const settings = productData.settings
        ? JSON.stringify(productData.settings)
        : "{}";

      const featured = productData.featured ? 1 : 0;
      const promotionalPrice = productData.promotional_price
        ? parseFloat(productData.promotional_price)
        : null;

      const [result] = await connection.query(
        `INSERT INTO products 
         (name, description, short_description, price, promotional_price, 
          category, stock, sku, image_url, images, material, dimensions, 
          weight, variants, specifications, shipping_info, seo, settings, 
          featured, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.name || "",
          productData.description || "",
          productData.short_description || "",
          parseFloat(productData.price) || 0,
          promotionalPrice,
          productData.category || "",
          parseInt(productData.stock) || 0,
          productData.sku || "",
          productData.image_url || "",
          images,
          productData.material || "",
          productData.dimensions || "",
          productData.weight || "",
          variants,
          specifications,
          shipping_info,
          seo,
          settings,
          featured,
          productData.status || "active",
        ],
      );

      return result.insertId;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar todos os produtos
  static async findAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT * FROM products WHERE 1=1";
      const params = [];

      if (filters.category) {
        query += " AND category = ?";
        params.push(filters.category);
      }

      if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.featured) {
        query += " AND featured = ?";
        params.push(filters.featured ? 1 : 0);
      }

      if (filters.search) {
        query +=
          " AND (name LIKE ? OR description LIKE ? OR short_description LIKE ?)";
        params.push(
          `%${filters.search}%`,
          `%${filters.search}%`,
          `%${filters.search}%`,
        );
      }

      if (filters.minPrice) {
        query += " AND price >= ?";
        params.push(parseFloat(filters.minPrice));
      }

      if (filters.maxPrice) {
        query += " AND price <= ?";
        params.push(parseFloat(filters.maxPrice));
      }

      if (filters.sku) {
        query += " AND sku = ?";
        params.push(filters.sku);
      }

      query += " ORDER BY created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(parseInt(filters.offset));
      }

      const [rows] = await connection.query(query, params);
      return rows.map((row) => this.fromDatabase(row));
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar produto por ID
  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar produto por SKU
  static async findBySku(sku) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE sku = ?",
        [sku],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } catch (error) {
      console.error("Erro ao buscar produto por SKU:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Atualizar produto
  static async update(id, productData) {
    const connection = await pool.getConnection();
    try {
      // Preparar dados
      const images = Array.isArray(productData.images)
        ? JSON.stringify(productData.images)
        : "[]";

      const variants = productData.variants
        ? JSON.stringify(productData.variants)
        : "{}";

      const specifications = productData.specifications
        ? JSON.stringify(productData.specifications)
        : "[]";

      const shipping_info = productData.shipping_info
        ? JSON.stringify(productData.shipping_info)
        : "{}";

      const seo = productData.seo ? JSON.stringify(productData.seo) : "{}";

      const settings = productData.settings
        ? JSON.stringify(productData.settings)
        : "{}";

      const featured = productData.featured ? 1 : 0;
      const promotionalPrice = productData.promotional_price
        ? parseFloat(productData.promotional_price)
        : null;

      await connection.query(
        `UPDATE products SET 
          name = ?, description = ?, short_description = ?, price = ?, 
          promotional_price = ?, category = ?, stock = ?, sku = ?, 
          image_url = ?, images = ?, material = ?, dimensions = ?, 
          weight = ?, variants = ?, specifications = ?, shipping_info = ?, 
          seo = ?, settings = ?, featured = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          productData.name || "",
          productData.description || "",
          productData.short_description || "",
          parseFloat(productData.price) || 0,
          promotionalPrice,
          productData.category || "",
          parseInt(productData.stock) || 0,
          productData.sku || "",
          productData.image_url || "",
          images,
          productData.material || "",
          productData.dimensions || "",
          productData.weight || "",
          variants,
          specifications,
          shipping_info,
          seo,
          settings,
          featured,
          productData.status || "active",
          id,
        ],
      );

      return true;
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Deletar produto
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM products WHERE id = ?", [id]);
      return true;
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Contar produtos
  static async count(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT COUNT(*) as total FROM products WHERE 1=1";
      const params = [];

      if (filters.category) {
        query += " AND category = ?";
        params.push(filters.category);
      }

      if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.featured) {
        query += " AND featured = ?";
        params.push(filters.featured ? 1 : 0);
      }

      const [rows] = await connection.query(query, params);
      return rows[0].total;
    } catch (error) {
      console.error("Erro ao contar produtos:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar produtos por status
  static async findByStatus(status) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE status = ? ORDER BY created_at DESC",
        [status],
      );
      return rows.map((row) => this.fromDatabase(row));
    } catch (error) {
      console.error("Erro ao buscar produtos por status:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar produtos em promoção
  static async findPromotional() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE promotional_price IS NOT NULL AND promotional_price > 0 ORDER BY created_at DESC",
      );
      return rows.map((row) => this.fromDatabase(row));
    } catch (error) {
      console.error("Erro ao buscar produtos promocionais:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Incrementar estoque
  static async incrementStock(id, quantity) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        "UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [quantity, id],
      );
      return true;
    } catch (error) {
      console.error("Erro ao incrementar estoque:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Decrementar estoque
  static async decrementStock(id, quantity) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        "UPDATE products SET stock = GREATEST(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [quantity, id],
      );
      return true;
    } catch (error) {
      console.error("Erro ao decrementar estoque:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Verificar se SKU já existe
  static async skuExists(sku, excludeId = null) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT COUNT(*) as count FROM products WHERE sku = ?";
      const params = [sku];

      if (excludeId) {
        query += " AND id != ?";
        params.push(excludeId);
      }

      const [rows] = await connection.query(query, params);
      return rows[0].count > 0;
    } catch (error) {
      console.error("Erro ao verificar SKU:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Product;
