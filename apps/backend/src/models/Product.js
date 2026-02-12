// src/models/Product.js - ATUALIZADO
const { pool } = require("../config/database-simple");

class Product {
  constructor({
    id,
    name,
    description,
    short_description,
    price,
    promotional_price,
    category,
    category_id,
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
    this.price = parseFloat(price) || 0;
    this.promotional_price = promotional_price
      ? parseFloat(promotional_price)
      : null;
    this.category = category || "";
    this.category_id = category_id ? parseInt(category_id) : null;
    this.stock = parseInt(stock) || 0;
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
    this.featured = featured ? true : false;
    this.status = status || "active";
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static fromDatabase(row) {
    const safeParse = (data, defaultValue) => {
      try {
        if (!data) return defaultValue;
        if (typeof data === "string") {
          return JSON.parse(data);
        }
        return data;
      } catch {
        return defaultValue;
      }
    };

    let images = [];
    try {
      if (row.images) {
        images =
          typeof row.images === "string"
            ? safeParse(row.images, [])
            : row.images;
      }
    } catch {
      images = [];
    }

    // Processar URLs das imagens
    let image_url = row.image_url || "";
    if (
      image_url &&
      !image_url.startsWith("http") &&
      !image_url.startsWith("data:image") &&
      !image_url.startsWith("/")
    ) {
      image_url = `/uploads/${image_url}`;
    }

    const processedImages = images.map((img) => {
      if (
        img &&
        !img.startsWith("http") &&
        !img.startsWith("data:image") &&
        !img.startsWith("/")
      ) {
        return `/uploads/${img}`;
      }
      return img;
    });

    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      short_description: row.short_description,
      price: row.price,
      promotional_price: row.promotional_price,
      category: row.category,
      category_id: row.category_id,
      stock: row.stock,
      sku: row.sku,
      image_url: image_url,
      images: processedImages,
      material: row.material,
      dimensions: row.dimensions,
      weight: row.weight,
      variants: safeParse(row.variants, {}),
      specifications: safeParse(row.specifications, []),
      shipping_info: safeParse(row.shipping_info, {}),
      seo: safeParse(row.seo, {}),
      settings: safeParse(row.settings, {}),
      featured: row.featured,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  static async create(productData) {
    const connection = await pool.getConnection();
    try {
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

      const [result] = await connection.query(
        `INSERT INTO products 
         (name, description, short_description, price, promotional_price, 
          category, category_id, stock, sku, image_url, images, material, 
          dimensions, weight, variants, specifications, shipping_info, 
          seo, settings, featured, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.name || "",
          productData.description || "",
          productData.short_description || "",
          parseFloat(productData.price) || 0,
          productData.promotional_price || null,
          productData.category || "",
          productData.category_id || null,
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
          productData.featured ? 1 : 0,
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

  static async findAll(filters = {}) {
    const connection = await pool.getConnection();
    try {
      let query = "SELECT * FROM products WHERE 1=1";
      const params = [];

      if (filters.category) {
        query += " AND category = ?";
        params.push(filters.category);
      }

      if (filters.category_id) {
        query += " AND category_id = ?";
        params.push(parseInt(filters.category_id));
      }

      if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.featured !== undefined) {
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

      query += " ORDER BY created_at DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        params.push(parseInt(filters.limit));
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

  static async findById(id) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
      );
      return rows.length > 0 ? this.fromDatabase(rows[0]) : null;
    } finally {
      connection.release();
    }
  }

  static async update(id, productData) {
    const connection = await pool.getConnection();
    try {
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

      await connection.query(
        `UPDATE products SET 
          name = ?, description = ?, short_description = ?, price = ?, 
          promotional_price = ?, category = ?, category_id = ?, stock = ?, 
          sku = ?, image_url = ?, images = ?, material = ?, dimensions = ?, 
          weight = ?, variants = ?, specifications = ?, shipping_info = ?, 
          seo = ?, settings = ?, featured = ?, status = ?
         WHERE id = ?`,
        [
          productData.name || "",
          productData.description || "",
          productData.short_description || "",
          parseFloat(productData.price) || 0,
          productData.promotional_price || null,
          productData.category || "",
          productData.category_id || null,
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
          productData.featured ? 1 : 0,
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

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM products WHERE id = ?", [id]);
      return true;
    } finally {
      connection.release();
    }
  }

  static async findByCategoryId(categoryId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC",
        [categoryId],
      );
      return rows.map((row) => this.fromDatabase(row));
    } finally {
      connection.release();
    }
  }

  static async countByCategoryId(categoryId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
        [categoryId],
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }
}

module.exports = Product;
