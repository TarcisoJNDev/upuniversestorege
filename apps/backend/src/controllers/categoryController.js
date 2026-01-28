const Category = require("../models/Category");

class CategoryController {
  // Criar nova categoria
  async create(req, res) {
    try {
      const categoryData = req.body;

      // Validação básica
      if (!categoryData.name || !categoryData.slug) {
        return res.status(400).json({
          error: "Nome e slug são obrigatórios",
        });
      }

      // Verificar se slug já existe
      const existingCategory = await Category.findBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(400).json({
          error: "Slug já está em uso",
        });
      }

      const categoryId = await Category.create(categoryData);
      const category = await Category.findById(categoryId);

      res.status(201).json({
        success: true,
        message: "Categoria criada com sucesso!",
        category,
      });
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      res.status(500).json({
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
      // (Você pode implementar esta verificação depois)

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
}

module.exports = new CategoryController();
