const Product = require("../models/Product");

class ProductController {
  // Criar novo produto
  async create(req, res) {
    try {
      const productData = req.body;

      // Validação básica
      if (!productData.name || !productData.price || !productData.category) {
        return res.status(400).json({
          error: "Nome, preço e categoria são obrigatórios",
        });
      }

      const productId = await Product.create(productData);

      // Buscar produto criado
      const product = await Product.findById(productId);

      res.status(201).json({
        success: true,
        message: "Produto criado com sucesso!",
        product,
      });
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({
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
        status: req.query.status,
        featured: req.query.featured,
        search: req.query.search,
        limit: req.query.limit,
      };

      const products = await Product.findAll(filters);
      res.json({ products });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ error: "Erro ao buscar produtos" });
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
  async update(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;

      const productExists = await Product.findById(id);
      if (!productExists) {
        return res.status(404).json({ error: "Produto não encontrado" });
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
      res.status(500).json({ error: "Erro ao atualizar produto" });
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
}

module.exports = new ProductController();
