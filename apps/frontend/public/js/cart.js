// public/js/cart.js - VERSÃO COM BACKEND (CARRINHO POR USUÁRIO)

// ============================================
// ===== GERENCIADOR DE SESSÃO =====
// ============================================
const SessionManager = {
  // Gerar ou recuperar ID de sessão único
  getSessionId() {
    let sessionId = sessionStorage.getItem("universo_session_id");
    if (!sessionId) {
      // Gera ID único: timestamp + número aleatório + caracteres aleatórios
      sessionId =
        "sess_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("universo_session_id", sessionId);
    }
    return sessionId;
  },

  // Limpar sessão (opcional - para logout)
  clearSession() {
    sessionStorage.removeItem("universo_session_id");
  },
};

// ============================================
// ===== CONFIGURAÇÃO DA API =====
// ============================================
const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:5000/api"
  : "https://upuniversestorege.onrender.com/api";

// ============================================
// ===== CART MANAGER COM BACKEND =====
// ============================================
class CartManager {
  constructor() {
    this.sessionId = SessionManager.getSessionId();
    this.apiBaseUrl = API_BASE_URL;
    this.cart = { items: [], total: 0, count: 0 };
    this.initialized = false;
  }

  // Inicializar (carregar do backend)
  async initialize() {
    if (this.initialized) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/cart/${this.sessionId}`);
      if (response.ok) {
        const data = await response.json();
        this.cart = data.cart || { items: [], total: 0, count: 0 };
        console.log(
          `🛒 Carrinho carregado para sessão: ${this.sessionId}`,
          this.cart,
        );
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do backend:", error);
    }

    this.initialized = true;
    this.updateCartCount();
  }

  // Obter o carrinho atual
  getCart() {
    return this.cart;
  }

  // Salvar carrinho no backend
  async saveCart() {
    try {
      await fetch(`${this.apiBaseUrl}/cart/${this.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.cart),
      });
    } catch (error) {
      console.error("Erro ao salvar carrinho no backend:", error);
    }
    this.updateCartCount();
  }

  // Adicionar produto ao carrinho
  async addToCart(productId, quantity = 1) {
    try {
      // Buscar detalhes do produto da API
      const response = await fetch(`${this.apiBaseUrl}/products/${productId}`);
      if (!response.ok) throw new Error("Produto não encontrado");

      const data = await response.json();
      const product = data.product;

      // Verificar se o produto já está no carrinho
      const existingItemIndex = this.cart.items.findIndex(
        (item) => item.id == productId,
      );

      if (existingItemIndex > -1) {
        // Atualizar quantidade se já existir
        this.cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Adicionar novo item
        this.cart.items.push({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          promotional_price: product.promotional_price
            ? parseFloat(product.promotional_price)
            : null,
          image_url: product.image_url,
          category: product.category || "Sem categoria",
          quantity: quantity,
          stock: product.stock || 0,
        });
      }

      // Recalcular totais
      this.calculateTotals();
      await this.saveCart();

      return {
        success: true,
        message: "Produto adicionado ao carrinho",
        cart: this.cart,
      };
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      return {
        success: false,
        message: "Erro ao adicionar produto ao carrinho",
      };
    }
  }

  // Remover produto do carrinho
  async removeFromCart(productId) {
    this.cart.items = this.cart.items.filter((item) => item.id != productId);
    this.calculateTotals();
    await this.saveCart();
    return this.cart;
  }

  // Atualizar quantidade
  async updateQuantity(productId, quantity) {
    const itemIndex = this.cart.items.findIndex((item) => item.id == productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.cart.items.splice(itemIndex, 1);
      } else {
        this.cart.items[itemIndex].quantity = quantity;
      }
      this.calculateTotals();
      await this.saveCart();
    }

    return this.cart;
  }

  // Limpar carrinho
  async clearCart() {
    this.cart = { items: [], total: 0, count: 0 };
    await this.saveCart();
    return this.cart;
  }

  // Calcular totais
  calculateTotals() {
    this.cart.total = this.cart.items.reduce((sum, item) => {
      const price = item.promotional_price || item.price;
      return sum + price * item.quantity;
    }, 0);

    this.cart.count = this.cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }

  // Atualizar contador no header
  updateCartCount() {
    const cartCountElements = document.querySelectorAll(".cart-count");

    cartCountElements.forEach((element) => {
      element.textContent = this.cart.count;

      if (this.cart.count > 0) {
        element.classList.add("pulse");
        setTimeout(() => element.classList.remove("pulse"), 300);
      }
    });
  }

  // Gerar mensagem para WhatsApp
  generateWhatsAppMessage() {
    if (this.cart.items.length === 0) {
      return null;
    }

    let message =
      "Olá! Gostaria de fazer um pedido na Universo Paralelo Store.\n\n";
    message += "*RESUMO DO PEDIDO*\n\n";
    message += "*Itens:*\n";

    this.cart.items.forEach((item, index) => {
      const price = item.promotional_price || item.price;
      const total = price * item.quantity;
      message += `${index + 1}. ${item.name} - ${item.quantity}x R$ ${price.toFixed(2)} = R$ ${total.toFixed(2)}\n`;
    });

    message += `\n*Total do Pedido: R$ ${this.cart.total.toFixed(2)}*\n\n`;
    message += "Por favor, entre em contato para finalizar a compra!\n";
    message += "Obrigado!";

    return encodeURIComponent(message);
  }
}

// Instância global
const cartManager = new CartManager();

// Função auxiliar para URL de imagens
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  }
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/"))
    return `https://upuniversestorege.onrender.com${imagePath}`;
  return `https://upuniversestorege.onrender.com/uploads/${imagePath}`;
}

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", async function () {
  await cartManager.initialize();
});

// Exportar para uso global
window.cartManager = cartManager;
window.getImageUrl = getImageUrl;
window.SessionManager = SessionManager;
