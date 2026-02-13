// ============================================
// ===== CONFIGURAÇÃO DA API =====
// ============================================
const IS_LOCALHOST =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCALHOST
  ? "http://localhost:5000/api"
  : "https://upuniversestorege.onrender.com/api";

console.log("🚀 Carrinho iniciado");
console.log("🌐 API Base URL:", API_BASE_URL);

// ============================================
// ===== FUNÇÕES AUXILIARES =====
// ============================================
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  }
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/"))
    return `https://upuniversestorege.onrender.com${imagePath}`;
  return `https://upuniversestorege.onrender.com/uploads/${imagePath}`;
}

// ============================================
// ===== FUNÇÕES DO CARRINHO =====
// ============================================
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar carrinho
  loadCart();
  setupEventListeners();
  loadRecommendedProducts();
  setupScrollAnimation();

  // Atualizar contador do carrinho
  cartManager.updateCartCount();

  // Newsletter
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Inscrição realizada com sucesso!");
      this.reset();
    });
  }
});

// Carregar carrinho
async function loadCart() {
  const cart = cartManager.getCart();

  if (cart.items.length === 0) {
    showEmptyCart();
    return;
  }

  // Carregar detalhes dos produtos
  await renderCartItems(cart);
  calculateTotalWithShipping();
}

// Renderizar itens do carrinho
async function renderCartItems(cart) {
  const cartItemsContainer = document.getElementById("cartItems");
  cartItemsContainer.innerHTML = "";

  // Cabeçalho da tabela
  const headerDiv = document.createElement("div");
  headerDiv.className = "cart-table-header";
  headerDiv.innerHTML = `
    <div class="header-product">Produto</div>
    <div class="header-price">Preço</div>
    <div class="header-quantity">Quantidade</div>
    <div class="header-total">Total</div>
    <div class="header-remove">Remover</div>
  `;
  cartItemsContainer.appendChild(headerDiv);

  // Para cada item do carrinho, buscar detalhes da API
  for (const item of cart.items) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${item.id}`);

      if (response.ok) {
        const data = await response.json();
        const product = data.product;

        const imageUrl = getImageUrl(product.image_url);
        const itemPrice = item.promotional_price || item.price;
        const itemTotal = itemPrice * item.quantity;
        const stock = product.stock || 10;
        const maxQuantity = Math.min(stock, 10);

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";
        itemElement.dataset.productId = item.id;
        itemElement.innerHTML = `
          <div class="item-product">
            <div class="product-image">
              <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
            </div>
            <div class="product-info">
              <h3 class="product-name">${product.name}</h3>
              <p class="product-category">${product.category || "Sem categoria"}</p>
              <div class="product-options">
                <span class="option-label">Material:</span>
                <span class="option-value">${product.material || "PLA"}</span>
              </div>
              ${stock <= 5 ? `<small style="color: #ff4757;">Apenas ${stock} em estoque!</small>` : ""}
            </div>
          </div>

          <div class="item-price">
            <span class="price-value">
              ${
                item.promotional_price
                  ? `<span style="text-decoration: line-through; color: #888; font-size: 14px;">R$ ${item.price.toFixed(2)}</span><br>
                   <span style="color: #C61EE6; font-weight: bold;">R$ ${item.promotional_price.toFixed(2)}</span>`
                  : `R$ ${item.price.toFixed(2)}`
              }
            </span>
          </div>

          <div class="item-quantity">
            <button class="quantity-btn minus-btn">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${maxQuantity}">
            <button class="quantity-btn plus-btn">
              <i class="fas fa-plus"></i>
            </button>
          </div>

          <div class="item-total">
            <span class="total-value">R$ ${itemTotal.toFixed(2)}</span>
          </div>

          <div class="item-remove">
            <button class="remove-btn">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;

        cartItemsContainer.appendChild(itemElement);
      }
    } catch (error) {
      console.error(`Erro ao carregar produto ${item.id}:`, error);
    }
  }

  // Adicionar ações do carrinho
  const actionsElement = document.createElement("div");
  actionsElement.className = "cart-actions";
  actionsElement.innerHTML = `
    <a href="catalogo.html" class="btn-continue">
      <i class="fas fa-arrow-left"></i> Continuar Comprando
    </a>
    <button class="btn-clear" id="clearCartBtn">
      <i class="fas fa-trash"></i> Limpar Carrinho
    </button>
  `;
  cartItemsContainer.appendChild(actionsElement);

  // Mostrar resumo
  document.getElementById("cartSummary").style.display = "flex";
  document.getElementById("cartSubtitle").textContent =
    `${cart.items.length} item(s) no carrinho`;

  // Habilitar botão de checkout
  document.getElementById("checkout-btn").disabled = false;
}

// Mostrar carrinho vazio
function showEmptyCart() {
  document.getElementById("cartItems").innerHTML = `
    <div class="empty-cart">
      <i class="fas fa-shopping-cart fa-3x"></i>
      <h3>Seu carrinho está vazio</h3>
      <p>Adicione produtos incríveis ao seu carrinho!</p>
      <a href="catalogo.html" class="btn-primary">Ver Catálogo</a>
    </div>
  `;

  document.getElementById("cartSummary").style.display = "none";
  document.getElementById("cartSubtitle").textContent =
    "Seu carrinho está vazio";
  document.getElementById("checkout-btn").disabled = true;
}

// Configurar event listeners
function setupEventListeners() {
  // Delegar eventos para elementos dinâmicos
  document.addEventListener("click", function (e) {
    // Botão menos
    if (e.target.closest(".minus-btn")) {
      e.preventDefault();
      const item = e.target.closest(".cart-item");
      if (!item) return;

      const productId = item.dataset.productId;
      const input = item.querySelector(".quantity-input");
      let quantity = parseInt(input.value);

      if (quantity > 1) {
        quantity--;
        input.value = quantity;
        updateCartItem(productId, quantity);
      }
    }

    // Botão mais
    if (e.target.closest(".plus-btn")) {
      e.preventDefault();
      const item = e.target.closest(".cart-item");
      if (!item) return;

      const productId = item.dataset.productId;
      const input = item.querySelector(".quantity-input");
      let quantity = parseInt(input.value);
      const max = parseInt(input.max);

      if (quantity < max) {
        quantity++;
        input.value = quantity;
        updateCartItem(productId, quantity);
      } else {
        alert(`Limite máximo de ${max} unidades atingido`);
      }
    }

    // Remover item
    if (e.target.closest(".remove-btn")) {
      e.preventDefault();
      const item = e.target.closest(".cart-item");
      if (!item) return;

      const productId = item.dataset.productId;
      const productName = item.querySelector(".product-name").textContent;

      if (confirm(`Deseja remover "${productName}" do carrinho?`)) {
        removeCartItem(productId);
      }
    }

    // Limpar carrinho
    if (e.target.closest("#clearCartBtn")) {
      e.preventDefault();
      if (confirm("Tem certeza que deseja limpar todo o carrinho?")) {
        cartManager.clearCart();
        showEmptyCart();
        cartManager.updateCartCount();
      }
    }
  });

  // Input de quantidade
  document.addEventListener("change", function (e) {
    if (e.target.classList.contains("quantity-input")) {
      const item = e.target.closest(".cart-item");
      if (!item) return;

      const productId = item.dataset.productId;
      const quantity = parseInt(e.target.value);
      const max = parseInt(e.target.max);

      if (quantity >= 1 && quantity <= max) {
        updateCartItem(productId, quantity);
      } else {
        alert(`Quantidade deve ser entre 1 e ${max}`);
        e.target.value = 1;
        updateCartItem(productId, 1);
      }
    }
  });

  // Opção de frete
  const shippingSelect = document.getElementById("shipping-method");
  if (shippingSelect) {
    shippingSelect.addEventListener("change", function () {
      calculateTotalWithShipping();
    });
  }

  // Botão de finalizar compra
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      finalizePurchase();
    });
  }

  // Modal de confirmação
  const modalClose = document.querySelector(".modal-close");
  const continueShopping = document.getElementById("continueShopping");
  const modal = document.getElementById("confirmation-modal");

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (continueShopping) {
    continueShopping.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
}

// Atualizar item do carrinho
function updateCartItem(productId, quantity) {
  // Atualizar a quantidade no cartManager
  cartManager.updateQuantity(productId, quantity);

  // Atualizar o total do item na interface
  const itemElement = document.querySelector(
    `.cart-item[data-product-id="${productId}"]`,
  );
  if (itemElement) {
    const priceElement = itemElement.querySelector(".price-value");
    const priceText = priceElement.innerHTML;

    // Extrair preço do HTML (pode ter promoção)
    let price;
    if (priceText.includes("text-decoration: line-through")) {
      const promoMatch = priceText.match(
        /R\$ ([\d.,]+)<\/span><br>\s*<span[^>]*>R\$ ([\d.,]+)/,
      );
      price = promoMatch ? parseFloat(promoMatch[2].replace(",", ".")) : 0;
    } else {
      const priceMatch = priceText.match(/R\$ ([\d.,]+)/);
      price = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : 0;
    }

    const totalElement = itemElement.querySelector(".total-value");
    const total = price * quantity;
    totalElement.textContent = `R$ ${total.toFixed(2)}`;
  }

  // Recalcular o total
  calculateTotalWithShipping();

  // Atualizar contador do carrinho
  cartManager.updateCartCount();

  // Se o carrinho ficar vazio
  const updatedCart = cartManager.getCart();
  if (updatedCart.items.length === 0) {
    showEmptyCart();
  }
}

// Calcular total incluindo frete (ÚNICA VERSÃO)
function calculateTotalWithShipping() {
  const subtotalElement = document.getElementById("subtotal");
  const totalElement = document.getElementById("total-price");
  const shippingSelect = document.getElementById("shipping-method");

  // Recalcular o subtotal somando todos os itens da tela
  let novoSubtotal = 0;
  document.querySelectorAll(".cart-item").forEach((item) => {
    const totalValue = item.querySelector(".total-value").textContent;
    const valor = parseFloat(totalValue.replace("R$", "").replace(",", "."));
    novoSubtotal += valor;
  });

  // Obter valor do frete baseado na seleção
  let shipping = 0;
  if (shippingSelect) {
    const value = shippingSelect.value;
    if (value === "standard") shipping = 15;
    else if (value === "express") shipping = 25;
  }

  // Calcular total
  const total = novoSubtotal + shipping;

  // Atualizar interface
  subtotalElement.textContent = `R$ ${novoSubtotal.toFixed(2)}`;
  totalElement.textContent = `R$ ${total.toFixed(2)}`;

  console.log(
    `📊 Cálculo: Subtotal R$ ${novoSubtotal.toFixed(2)} + Frete R$ ${shipping.toFixed(2)} = Total R$ ${total.toFixed(2)}`,
  );
}

// Remover item do carrinho
function removeCartItem(productId) {
  const cart = cartManager.removeFromCart(productId);
  cartManager.updateCartCount();

  // Remover elemento da interface
  const itemElement = document.querySelector(
    `.cart-item[data-product-id="${productId}"]`,
  );
  if (itemElement) {
    itemElement.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => {
      itemElement.remove();

      if (cart.items.length === 0) {
        showEmptyCart();
      } else {
        calculateTotalWithShipping();
      }
    }, 300);
  }
}

// Finalizar compra (WhatsApp)
function finalizePurchase() {
  const cart = cartManager.getCart();

  if (cart.items.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Gerar mensagem para WhatsApp
  const message = cartManager.generateWhatsAppMessage();

  if (!message) {
    alert("Erro ao gerar mensagem para WhatsApp");
    return;
  }

  // Número do WhatsApp da loja (SUBSTITUA pelo número real)
  const phoneNumber = "5521999999999";

  // Abrir WhatsApp
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
}

// Carregar produtos recomendados da API
async function loadRecommendedProducts() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products?limit=4&featured=true`,
    );

    if (response.ok) {
      const data = await response.json();
      const products = data.products || [];

      if (products.length > 0) {
        const recommendationsGrid = document.getElementById(
          "recommendationsGrid",
        );
        recommendationsGrid.innerHTML = "";

        products.forEach((product) => {
          const imageUrl = getImageUrl(product.image_url);
          const price = product.promotional_price || product.price;

          const productCard = document.createElement("div");
          productCard.className = "recommended-product";
          productCard.innerHTML = `
            <div class="product-image">
              <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
            </div>
            <div class="product-info">
              <h3>${product.name}</h3>
              <p class="product-price">
                ${
                  product.promotional_price
                    ? `<span style="text-decoration: line-through; color: #888; font-size: 14px;">R$ ${parseFloat(product.price).toFixed(2)}</span><br>
                       <span style="color: #C61EE6; font-weight: bold;">R$ ${parseFloat(product.promotional_price).toFixed(2)}</span>`
                    : `R$ ${parseFloat(product.price).toFixed(2)}`
                }
              </p>
              <button class="btn-add-to-cart" data-product-id="${product.id}">
                <i class="fas fa-cart-plus"></i> Adicionar
              </button>
            </div>
          `;

          recommendationsGrid.appendChild(productCard);
        });

        document.getElementById("recommendationsSection").style.display =
          "block";

        document.querySelectorAll(".btn-add-to-cart").forEach((button) => {
          button.addEventListener("click", async function (e) {
            e.preventDefault();
            const productId = this.dataset.productId;
            const result = await cartManager.addToCart(productId, 1);

            if (result.success) {
              const modal = document.getElementById("confirmation-modal");
              const message = modal.querySelector("#modalMessage");
              const productName = this.closest(
                ".recommended-product",
              ).querySelector("h3").textContent;
              message.textContent = `"${productName}" foi adicionado ao seu carrinho com sucesso.`;
              modal.style.display = "flex";

              loadCart();
            } else {
              alert("Erro ao adicionar produto");
            }
          });
        });
      }
    }
  } catch (error) {
    console.error("Erro ao carregar produtos recomendados:", error);
  }
}

// Configurar animação de scroll
function setupScrollAnimation() {
  const revealElements = document.querySelectorAll(".reveal");

  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    const revealPoint = 100;

    revealElements.forEach((element) => {
      const revealTop = element.getBoundingClientRect().top;

      if (revealTop < windowHeight - revealPoint) {
        element.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
}
