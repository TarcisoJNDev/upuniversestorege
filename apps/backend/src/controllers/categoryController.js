const Category = require("../models/Category");
const Product = require("../models/Product");

class CategoryController {
  // Criar nova categoria (CORRIGIDO)
  async create(req, res) {
    try {
      console.log("🏷️ Recebendo dados da categoria...");
      console.log("📄 Body:", req.body);

      const categoryData = { ...req.body };

      // Validação básica para categoria
      if (!categoryData.name) {
        return res.status(400).json({
          success: false,
          error: "Nome da categoria é obrigatório",
        });
      }

      // Se não tiver slug, criar automaticamente
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }

      // Garantir que parent_id seja null se for string vazia
      if (categoryData.parent_id === "") {
        categoryData.parent_id = null;
      }

      // Verificar se slug já existe
      const existingCategory = await Category.findBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: "Slug já está em uso",
        });
      }

      console.log("💾 Salvando categoria no banco...");
      console.log("Dados a serem salvos:", categoryData);

      const categoryId = await Category.create(categoryData);
      const category = await Category.findById(categoryId);

      console.log("✅ Categoria criada com sucesso!");
      console.log("Categoria retornada:", category);

      res.status(201).json({
        success: true,
        message: "Categoria criada com sucesso!",
        category,
      });
    } catch (error) {
      console.error("❌ Erro ao criar categoria:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao criar categoria",
        details: error.message,
      });
    }
  }

  // Listar todas as categorias
  async getAll(req, res) {
    try {
      const filters = {
        parent_id: req.query.parent_id,
        status: req.query.status,
      };

      const categories = await Category.findAll(filters);
      res.json({ categories });
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  }

  // Buscar categoria por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      res.json({ category });
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      res.status(500).json({ error: "Erro ao buscar categoria" });
    }
  }

  // Buscar categoria por slug
  async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const category = await Category.findBySlug(slug);

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      res.json({ category });
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      res.status(500).json({ error: "Erro ao buscar categoria" });
    }
  }

  // Atualizar categoria
  async update(req, res) {
    try {
      const { id } = req.params;
      const categoryData = req.body;

      const categoryExists = await Category.findById(id);
      if (!categoryExists) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      // Verificar se slug já existe (exceto para a própria categoria)
      if (categoryData.slug && categoryData.slug !== categoryExists.slug) {
        const existingCategory = await Category.findBySlug(categoryData.slug);
        if (existingCategory && existingCategory.id !== parseInt(id)) {
          return res.status(400).json({
            error: "Slug já está em uso",
          });
        }
      }

      // Garantir que parent_id seja null se for string vazia
      if (categoryData.parent_id === "") {
        categoryData.parent_id = null;
      }

      await Category.update(id, categoryData);
      const updatedCategory = await Category.findById(id);

      res.json({
        success: true,
        message: "Categoria atualizada com sucesso!",
        category: updatedCategory,
      });
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      res.status(500).json({ error: "Erro ao atualizar categoria" });
    }
  }

  // Deletar categoria
  async delete(req, res) {
    try {
      const { id } = req.params;

      const categoryExists = await Category.findById(id);
      if (!categoryExists) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      // Verificar se existem produtos nesta categoria
      const products = await Product.findByCategoryId(id);
      if (products && products.length > 0) {
        return res.status(400).json({
          success: false,
          error:
            "Não é possível excluir a categoria pois existem produtos associados a ela",
          productCount: products.length,
        });
      }

      await Category.delete(id);

      res.json({
        success: true,
        message: "Categoria deletada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      res.status(500).json({ error: "Erro ao deletar categoria" });
    }
  }

  // Listar produtos por categoria
  async getProductsByCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      const products = await Product.findByCategoryId(id);

      res.json({
        category,
        products,
        count: products.length,
      });
    } catch (error) {
      console.error("Erro ao buscar produtos por categoria:", error);
      res.status(500).json({ error: "Erro ao buscar produtos por categoria" });
    }
  }

  // Contar produtos por categoria
  async getProductCountByCategory(req, res) {
    try {
      const { id } = req.params;
      const count = await Product.countByCategoryId(id);
      res.json({ count });
    } catch (error) {
      console.error("Erro ao contar produtos por categoria:", error);
      res.status(500).json({ error: "Erro ao contar produtos por categoria" });
    }
  }

  // Listar todas as categorias COM CONTAGEM DE PRODUTOS
  async getAllWithProductCount(req, res) {
    try {
      const categories = await Category.findAllWithProductCount();
      res.json({ categories });
    } catch (error) {
      console.error("Erro ao buscar categorias com contagem:", error);
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  }
}

module.exports = new CategoryController();
