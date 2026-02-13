// public/js/cart.js - VERSÃO COMPLETA COM INTEGRAÇÃO AO RENDER

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
// ===== CART MANAGER =====
// ============================================
class CartManager {
  constructor() {
    this.cartKey = "universo_paralelo_cart";
    this.apiBaseUrl = API_BASE_URL;
  }

  // Obter o carrinho atual
  getCart() {
    const cart = localStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : { items: [], total: 0, count: 0 };
  }

  // Salvar carrinho
  saveCart(cart) {
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
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

      const cart = this.getCart();

      // Verificar se o produto já está no carrinho
      const existingItemIndex = cart.items.findIndex(
        (item) => item.id == productId,
      );

      if (existingItemIndex > -1) {
        // Atualizar quantidade se já existir
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Adicionar novo item
        cart.items.push({
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
      this.calculateTotals(cart);
      this.saveCart(cart);

      return {
        success: true,
        message: "Produto adicionado ao carrinho",
        cart: cart,
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
  removeFromCart(productId) {
    const cart = this.getCart();
    cart.items = cart.items.filter((item) => item.id != productId);
    this.calculateTotals(cart);
    this.saveCart(cart);
    return cart;
  }

  // Atualizar quantidade
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const itemIndex = cart.items.findIndex((item) => item.id == productId);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      this.calculateTotals(cart);
      this.saveCart(cart);
    }

    return cart;
  }

  // Limpar carrinho
  clearCart() {
    const cart = { items: [], total: 0, count: 0 };
    this.saveCart(cart);
    return cart;
  }

  // Calcular totais
  calculateTotals(cart) {
    cart.total = cart.items.reduce((sum, item) => {
      const price = item.promotional_price || item.price;
      return sum + price * item.quantity;
    }, 0);

    cart.count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return cart;
  }

  // Atualizar contador no header
  updateCartCount() {
    const cart = this.getCart();
    const cartCountElements = document.querySelectorAll(".cart-count");

    cartCountElements.forEach((element) => {
      element.textContent = cart.count;

      // Adicionar animação
      if (cart.count > 0) {
        element.classList.add("pulse");
        setTimeout(() => element.classList.remove("pulse"), 300);
      }
    });
  }

  // Gerar mensagem para WhatsApp
  generateWhatsAppMessage() {
    const cart = this.getCart();

    if (cart.items.length === 0) {
      return null;
    }

    let message =
      "Olá! Gostaria de fazer um pedido na Universo Paralelo Store.\n\n";
    message += "*RESUMO DO PEDIDO*\n\n";
    message += "*Itens:*\n";

    cart.items.forEach((item, index) => {
      const price = item.promotional_price || item.price;
      const total = price * item.quantity;
      message += `${index + 1}. ${item.name} - ${item.quantity}x R$ ${price.toFixed(2)} = R$ ${total.toFixed(2)}\n`;
    });

    message += `\n*Total do Pedido: R$ ${cart.total.toFixed(2)}*\n\n`;
    message += "Por favor, entre em contato para finalizar a compra!\n";
    message += "Obrigado!";

    return encodeURIComponent(message);
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

// Instância global do gerenciador de carrinho
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

// Inicializar contador do carrinho quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  cartManager.updateCartCount();
});

// Exportar para uso em outras páginas
window.cartManager = cartManager;
window.getImageUrl = getImageUrl;
