// public/js/cart.js - VERSÃO COMPLETA (com todas as funcionalidades)
console.log("🔍 DEBUG - cart.js iniciado");
console.log("🔍 DEBUG - window.API_CONFIG existe?", !!window.API_CONFIG);
if (window.API_CONFIG) {
  console.log("🔍 DEBUG - API_CONFIG.BASE_URL:", window.API_CONFIG.BASE_URL);
  console.log(
    "🔍 DEBUG - Ambiente:",
    window.API_CONFIG.BASE_URL.includes("localhost") ? "LOCAL" : "PRODUÇÃO",
  );
}
// ============================================
// ===== GERENCIADOR DE SESSÃO =====
// ============================================
const SessionManager = {
  getSessionId() {
    let sessionId = sessionStorage.getItem("universo_session_id");
    if (!sessionId) {
      sessionId =
        "sess_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("universo_session_id", sessionId);
    }
    return sessionId;
  },
  clearSession() {
    sessionStorage.removeItem("universo_session_id");
  },
};

// ============================================
// ===== CONFIGURAÇÃO DA API (USANDO API_CONFIG GLOBAL) =====
// ============================================
// NÃO redeclarar IS_LOCALHOST ou API_BASE_URL - usar window.API_CONFIG.BASE_URL

// ============================================
// ===== CART MANAGER COMPLETO =====
// ============================================
class CartManager {
  constructor() {
    this.sessionId = SessionManager.getSessionId();
    this.apiBaseUrl = window.API_CONFIG.BASE_URL; // USA A CONFIGURAÇÃO GLOBAL
    this.cart = { items: [], total: 0, count: 0 };
    this.initialized = false;
    // Número do WhatsApp (mantido do seu código)
    this.whatsappNumber = "558182047692";
  }

  // Inicializar (carregar do backend)
  async initialize() {
    if (this.initialized) return;

    try {
      console.log(`🔄 Inicializando carrinho para sessão: ${this.sessionId}`);
      const response = await fetch(`${this.apiBaseUrl}/cart/${this.sessionId}`);
      if (response.ok) {
        const data = await response.json();
        this.cart = data.cart || { items: [], total: 0, count: 0 };
        console.log(`✅ Carrinho carregado:`, this.cart);
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar carrinho do backend, usando local.");
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
      console.error("❌ Erro ao salvar carrinho no backend:", error);
    }
    this.updateCartCount();
  }

  // Adicionar produto ao carrinho
  async addToCart(productId, quantity = 1) {
    try {
      console.log(`📥 Buscando produto ${productId} da API...`);
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
      console.error("❌ Erro ao adicionar ao carrinho:", error);
      return {
        success: false,
        message: "Erro ao adicionar produto ao carrinho: " + error.message,
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

  // 🔴🔴🔴 GERAR MENSAGEM COMPLETA PARA WHATSAPP (igual ao seu código original) 🔴🔴🔴
  generateWhatsAppMessage() {
    if (this.cart.items.length === 0) {
      return null;
    }

    let message =
      "Olá! Gostaria de fazer um pedido na Universo Paralelo Store.\n\n";
    message += "*RESUMO DO PEDIDO*\n\n";
    message += "*Itens:*\n";

    let totalPedido = 0;

    this.cart.items.forEach((item, index) => {
      const preco = item.promotional_price || item.price;
      const subtotal = preco * item.quantity;
      totalPedido += subtotal;

      message += `${index + 1}. *${item.name}*\n`;
      message += `   Quantidade: ${item.quantity}\n`;
      message += `   Preço unitário: R$ ${preco.toFixed(2)}\n`;
      message += `   Subtotal: R$ ${subtotal.toFixed(2)}\n\n`;
    });

    // O frete será adicionado no carrinho.js, não aqui
    // Deixamos o total sem frete para ser calculado na página do carrinho

    message += `\n*Total do Pedido: R$ ${this.cart.total.toFixed(2)}*\n\n`;
    message += "Por favor, confirme os dados para finalizarmos o pedido!\n";
    message += "Obrigado!";

    return encodeURIComponent(message);
  }

  // 🔴🔴🔴 MÉTODO PARA FINALIZAR COMPRA (com o número do WhatsApp) 🔴🔴🔴
  finalizePurchase(frete = 0, metodoFrete = "Retirada na Loja") {
    if (this.cart.items.length === 0) {
      alert("Seu carrinho está vazio!");
      return false;
    }

    let mensagem =
      "Olá! Gostaria de fazer um pedido na Universo Paralelo Store.\n\n";
    mensagem += "*RESUMO DO PEDIDO*\n\n";
    mensagem += "*Itens:*\n";

    let totalPedido = 0;

    this.cart.items.forEach((item, index) => {
      const preco = item.promotional_price || item.price;
      const subtotal = preco * item.quantity;
      totalPedido += subtotal;

      mensagem += `${index + 1}. *${item.name}*\n`;
      mensagem += `   Quantidade: ${item.quantity}\n`;
      mensagem += `   Preço unitário: R$ ${preco.toFixed(2)}\n`;
      mensagem += `   Subtotal: R$ ${subtotal.toFixed(2)}\n\n`;
    });

    mensagem += `*Frete:* ${metodoFrete} - R$ ${frete.toFixed(2)}\n\n`;
    mensagem += `*TOTAL DO PEDIDO: R$ ${(totalPedido + frete).toFixed(2)}*\n\n`;
    mensagem += "Por favor, confirme os dados para finalizarmos o pedido!\n";
    mensagem += "Obrigado!";

    const mensagemCodificada = encodeURIComponent(mensagem);

    // Abrir WhatsApp com o número salvo
    window.open(
      `https://wa.me/${this.whatsappNumber}?text=${mensagemCodificada}`,
      "_blank",
    );

    console.log("📤 Mensagem gerada com sucesso!");
    console.log("📊 Carrinho usado:", this.cart);

    return true;
  }

  // Verificar disponibilidade em estoque
  async checkStock(productId, quantity = 1) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/products/${productId}`);
      if (!response.ok) return false;

      const data = await response.json();
      const product = data.product;

      return product.stock >= quantity;
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      return false;
    }
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
