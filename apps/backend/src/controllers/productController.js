// src/controllers/productController.js - ATUALIZADO
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

class ProductController {
  // Criar novo produto COM upload de imagens
  async create(req, res) {
    try {
      console.log("📦 Recebendo dados do produto...");
      console.log("📝 Body:", req.body);
      console.log("📁 Arquivos:", req.files);

      let productData = { ...req.body };

      // Processar imagens
      if (req.files) {
        if (req.files.main_image && req.files.main_image[0]) {
          const mainImage = req.files.main_image[0];
          productData.image_url = `/uploads/${mainImage.filename}`;
          console.log("📷 Imagem principal:", productData.image_url);
        }

        if (req.files.gallery_images) {
          productData.images = req.files.gallery_images.map(
            (file) => `/uploads/${file.filename}`,
          );
          console.log("🖼️ Galeria:", productData.images);
        }
      }

      // Processar category_id
      if (productData.category_id) {
        productData.category_id = parseInt(productData.category_id);

        // Buscar nome da categoria pelo ID
        const category = await Category.findById(productData.category_id);
        if (category) {
          productData.category = category.name;
          console.log(
            `🏷️ Categoria encontrada: ${category.name} (ID: ${category.id})`,
          );
        }
      }

      // Se não tiver category_id, tentar pelo nome
      if (!productData.category_id && productData.category) {
        const category = await Category.findByName(productData.category);
        if (category) {
          productData.category_id = category.id;
          console.log(
            `🏷️ Categoria encontrada pelo nome: ${category.name} (ID: ${category.id})`,
          );
        }
      }

      // Validação
      if (!productData.name) {
        return res
          .status(400)
          .json({ success: false, error: "Nome do produto é obrigatório" });
      }
      if (!productData.price || parseFloat(productData.price) <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Preço inválido" });
      }
      if (!productData.category_id && !productData.category) {
        return res
          .status(400)
          .json({ success: false, error: "Categoria é obrigatória" });
      }

      // Criar produto
      const productId = await Product.create(productData);
      console.log("✅ Produto criado com ID:", productId);

      const product = await Product.findById(productId);

      res.status(201).json({
        success: true,
        message: "Produto criado com sucesso!",
        product: product,
        productId: productId,
      });
    } catch (error) {
      console.error("❌ Erro ao criar produto:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao criar produto",
        details: error.message,
      });
    }
  }

  // Listar todos os produtos
  async getAll(req, res) {
    try {
      const filters = {
        category: req.query.category,
        category_id: req.query.category_id,
        status: req.query.status,
        featured: req.query.featured,
        search: req.query.search,
        limit: req.query.limit,
      };

      const products = await Product.findAll(filters);

      res.json({
        success: true,
        products,
        count: products.length,
      });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar produtos",
      });
    }
  }

  // Buscar produto por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Produto não encontrado" });
      }

      res.json({ success: true, product });
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      res.status(500).json({ success: false, error: "Erro ao buscar produto" });
    }
  }

  // Atualizar produto
  async update(req, res) {
    try {
      const { id } = req.params;
      let productData = { ...req.body };

      console.log("🔄 Atualizando produto:", id);
      console.log("📁 Arquivos:", req.files);

      const productExists = await Product.findById(id);
      if (!productExists) {
        return res
          .status(404)
          .json({ success: false, error: "Produto não encontrado" });
      }

      // Processar imagens
      if (req.files) {
        if (req.files.main_image && req.files.main_image[0]) {
          const mainImage = req.files.main_image[0];
          productData.image_url = `/uploads/${mainImage.filename}`;
        }

        if (req.files.gallery_images) {
          productData.images = req.files.gallery_images.map(
            (file) => `/uploads/${file.filename}`,
          );
        }
      }

      // Processar category_id
      if (productData.category_id) {
        productData.category_id = parseInt(productData.category_id);
        const category = await Category.findById(productData.category_id);
        if (category) {
          productData.category = category.name;
        }
      }

      await Product.update(id, productData);
      const updatedProduct = await Product.findById(id);

      res.json({
        success: true,
        message: "Produto atualizado com sucesso!",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao atualizar produto",
        details: error.message,
      });
    }
  }

  // Deletar produto
  async delete(req, res) {
    try {
      const { id } = req.params;
      const productExists = await Product.findById(id);

      if (!productExists) {
        return res
          .status(404)
          .json({ success: false, error: "Produto não encontrado" });
      }

      await Product.delete(id);

      res.json({
        success: true,
        message: "Produto deletado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      res
        .status(500)
        .json({ success: false, error: "Erro ao deletar produto" });
    }
  }

  // Produtos em destaque
  async getFeatured(req, res) {
    try {
      const products = await Product.findAll({ featured: true, limit: 8 });
      res.json({ success: true, products });
    } catch (error) {
      console.error("Erro ao buscar produtos em destaque:", error);
      res
        .status(500)
        .json({ success: false, error: "Erro ao buscar produtos em destaque" });
    }
  }

  // Produtos por categoria ID
  async getByCategoryId(req, res) {
    try {
      const { categoryId } = req.params;
      const id = parseInt(categoryId);

      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: "ID de categoria inválido" });
      }

      const products = await Product.findByCategoryId(id);

      res.json({
        success: true,
        products,
        categoryId: id,
        count: products.length,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar produtos por categoria ID:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar produtos por categoria",
        details: error.message,
      });
    }
  }

  // Produtos por categoria (nome)
  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = await Product.findAll({ category });
      res.json({ success: true, products });
    } catch (error) {
      console.error("Erro ao buscar produtos por categoria:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Erro ao buscar produtos por categoria",
        });
    }
  }
}

module.exports = new ProductController();
