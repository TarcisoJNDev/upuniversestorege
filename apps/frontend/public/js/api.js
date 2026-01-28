// public/js/api.js
const API_URL = "http://localhost:5000/api";

class ProductAPI {
  // Buscar todos os produtos
  static async getAllProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_URL}/products?${queryParams}`);
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Erro:", error);
      return [];
    }
  }

  // Buscar produto por ID
  static async getProductById(id) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      if (!response.ok) throw new Error("Produto não encontrado");
      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error("Erro:", error);
      return null;
    }
  }

  // Buscar produtos em destaque
  static async getFeaturedProducts() {
    try {
      const response = await fetch(`${API_URL}/products/featured`);
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error("Erro:", error);
      return [];
    }
  }

  // Criar novo produto (admin)
  static async createProduct(productData) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro:", error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar produto (admin)
  static async updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro:", error);
      return { success: false, error: error.message };
    }
  }

  // Deletar produto (admin)
  static async deleteProduct(id) {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro:", error);
      return { success: false, error: error.message };
    }
  }

  // ========== CATEGORIAS ==========

  // Buscar todas as categorias
  static async getAllCategories() {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) throw new Error("Erro ao buscar categorias");
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }
  }

  // Buscar categoria por ID
  static async getCategoryById(id) {
    try {
      const response = await fetch(`${API_URL}/categories/${id}`);
      if (!response.ok) throw new Error("Categoria não encontrada");
      const data = await response.json();
      return data.category;
    } catch (error) {
      console.error("Erro ao buscar categoria:", error);
      return null;
    }
  }

  // Criar nova categoria
  static async createCategory(categoryData) {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar categoria
  static async updateCategory(id, categoryData) {
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      return { success: false, error: error.message };
    }
  }

  // Deletar categoria
  static async deleteCategory(id) {
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      return { success: false, error: error.message };
    }
  }
}
