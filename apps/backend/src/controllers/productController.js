// controllers/productController.js
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");
const fs = require("fs");

class ProductController {
  // Criar novo produto COM upload de imagens
  async create(req, res) {
    try {
      console.log("📦 Recebendo dados do produto...");
      console.log("📝 Campos do body:", req.body);
      console.log("📁 Arquivos recebidos:", req.files);

      // DEBUG: Mostrar arquivos recebidos
      if (req.files) {
        console.log("📁 Arquivos recebidos:");
        console.log(
          "- main_image:",
          req.files.main_image ? req.files.main_image[0]?.filename : "Nenhum",
        );
        console.log(
          "- gallery_images:",
          req.files.gallery_images?.length || 0,
          "arquivo(s)",
        );
      }

      let productData = { ...req.body };

      // Processar imagens se existirem
      if (req.files) {
        // Imagem principal
        if (req.files.main_image && req.files.main_image[0]) {
          const mainImage = req.files.main_image[0];
          productData.image_url = `/uploads/${mainImage.filename}`;
          console.log("📷 Imagem principal salva em:", productData.image_url);
        }

        // Galeria de imagens
        if (req.files.gallery_images) {
          productData.images = req.files.gallery_images.map(
            (file) => `/uploads/${file.filename}`,
          );
          console.log("🖼️ Galeria salva:", productData.images);
        }
      }

      // Se tiver category, converter para ID
      if (productData.category && !productData.category_id) {
        const category = await Category.findByName(productData.category);
        if (category) {
          productData.category_id = category.id;
          productData.category = category.name; // Manter o nome também
        }
      }

      // Se não tiver category_id, usar 0
      if (!productData.category_id) {
        productData.category_id = 0;
      }

      // Validação básica
      if (!productData.name || !productData.price) {
        return res.status(400).json({
          error: "Nome e preço são obrigatórios",
        });
      }

      const productId = await Product.create(productData);
      console.log("✅ Produto criado no banco com ID:", productId);

      const product = await Product.findById(productId);
      console.log("📋 Produto recuperado:", product);

      // ENVIE SEMPRE UMA RESPOSTA JSON consistente
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  // Listar todos os produtos
  async getAll(req, res) {
    try {
      const filters = {
        category: req.query.category, // nome da categoria
        category_id: req.query.category_id, // ID da categoria (NOVO)
        status: req.query.status,
        featured: req.query.featured,
        search: req.query.search,
        limit: req.query.limit,
      };

      console.log("🔍 Filtros aplicados:", filters);

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
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      res.json({ product });
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  }

  // Atualizar produto
  // Atualizar produto COM upload de imagens
  async update(req, res) {
    try {
      const { id } = req.params;
      let productData = { ...req.body };

      console.log("🔄 Atualizando produto:", id);
      console.log("📁 Arquivos recebidos:", req.files);

      const productExists = await Product.findById(id);
      if (!productExists) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Processar imagens se existirem
      if (req.files) {
        // Imagem principal
        if (req.files.main_image && req.files.main_image[0]) {
          const mainImage = req.files.main_image[0];
          productData.image_url = `/uploads/${mainImage.filename}`;
          console.log("📷 Nova imagem principal:", productData.image_url);
        } else {
          // Manter imagem atual se não enviar nova
          productData.image_url = productExists.image_url;
        }

        // Galeria de imagens
        if (req.files.gallery_images && req.files.gallery_images.length > 0) {
          productData.images = req.files.gallery_images.map(
            (file) => `/uploads/${file.filename}`,
          );
          console.log("🖼️ Nova galeria:", productData.images);
        } else {
          // Manter galeria atual se não enviar novas
          productData.images = productExists.images;
        }
      } else {
        // Se não enviar arquivos, manter os atuais
        productData.image_url = productExists.image_url;
        productData.images = productExists.images;
      }

      // Se tiver category, converter para ID
      if (productData.category && !productData.category_id) {
        const category = await Category.findByName(productData.category);
        if (category) {
          productData.category_id = category.id;
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
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      await Product.delete(id);

      res.json({
        success: true,
        message: "Produto deletado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      res.status(500).json({ error: "Erro ao deletar produto" });
    }
  }

  // Produtos em destaque
  async getFeatured(req, res) {
    try {
      const products = await Product.findAll({ featured: true, limit: 8 });
      res.json({ products });
    } catch (error) {
      console.error("Erro ao buscar produtos em destaque:", error);
      res.status(500).json({ error: "Erro ao buscar produtos em destaque" });
    }
  }

  // Produtos por categoria
  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const products = await Product.findAll({ category });
      res.json({ products });
    } catch (error) {
      console.error("Erro ao buscar produtos por categoria:", error);
      res.status(500).json({ error: "Erro ao buscar produtos por categoria" });
    }
  }

  async getByCategoryId(req, res) {
    try {
      const { categoryId } = req.params;
      console.log("🔍 Buscando produtos por categoria ID:", categoryId);

      // Converter para número se for string
      const id = parseInt(categoryId);

      if (isNaN(id)) {
        return res.status(400).json({
          error: "ID de categoria inválido",
        });
      }

      const products = await Product.findByCategoryId(id);

      console.log(
        `✅ ${products.length} produtos encontrados para categoria ID ${id}`,
      );

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
}

module.exports = new ProductController();
