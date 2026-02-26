// ============================================
// ===== CONFIGURAÇÃO DA API (USANDO API_CONFIG) =====
// ============================================
console.log("🚀 Carrinho iniciado");
console.log("🌐 API Base URL:", API_CONFIG.BASE_URL);

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
  // Inicializar carrinho (agora assíncrono)
  initializeCart();
  setupEventListeners();
  loadRecommendedProducts();
  setupScrollAnimation();

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

// Nova função para inicializar o carrinho de forma assíncrona
async function initializeCart() {
  // Aguardar o cartManager ser inicializado
  if (cartManager.initialize) {
    await cartManager.initialize();
  }

  // Carregar o carrinho
  await loadCart();

  // Atualizar contador
  cartManager.updateCartCount();
}

// Carregar carrinho (agora assíncrono)
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

// Renderizar itens do carrinho (agora com verificação de estoque)
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
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/products/${item.id}`,
      );

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

// Configurar event listeners (agora com funções assíncronas)
function setupEventListeners() {
  // Delegar eventos para elementos dinâmicos
  document.addEventListener("click", async function (e) {
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
        await updateCartItem(productId, quantity);
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
        await updateCartItem(productId, quantity);
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
        await removeCartItem(productId);
      }
    }

    // Limpar carrinho
    if (e.target.closest("#clearCartBtn")) {
      e.preventDefault();
      if (confirm("Tem certeza que deseja limpar todo o carrinho?")) {
        await cartManager.clearCart();
        showEmptyCart();
        cartManager.updateCartCount();
      }
    }
  });

  // Input de quantidade
  document.addEventListener("change", async function (e) {
    if (e.target.classList.contains("quantity-input")) {
      const item = e.target.closest(".cart-item");
      if (!item) return;

      const productId = item.dataset.productId;
      const quantity = parseInt(e.target.value);
      const max = parseInt(e.target.max);

      if (quantity >= 1 && quantity <= max) {
        await updateCartItem(productId, quantity);
      } else {
        alert(`Quantidade deve ser entre 1 e ${max}`);
        e.target.value = 1;
        await updateCartItem(productId, 1);
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

// Atualizar item do carrinho (agora async e usando await)
async function updateCartItem(productId, quantity) {
  try {
    await cartManager.updateQuantity(productId, quantity);

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
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    showNotification("Erro ao atualizar quantidade", "error");
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

// Remover item do carrinho (agora async)
async function removeCartItem(productId) {
  try {
    const cart = await cartManager.removeFromCart(productId);
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
  } catch (error) {
    console.error("Erro ao remover item:", error);
    showNotification("Erro ao remover produto", "error");
  }
}

// Finalizar compra (WhatsApp) - VERSÃO CORRIGIDA
function finalizePurchase() {
  // Forçar a leitura do carrinho atualizado
  const cart = cartManager.getCart();

  if (cart.items.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Recalcular os totais para garantir que estão corretos
  let mensagem =
    "Olá! Gostaria de fazer um pedido na Universo Paralelo Store.\n\n";
  mensagem += "*RESUMO DO PEDIDO*\n\n";
  mensagem += "*Itens:*\n";

  let totalPedido = 0;

  // Usar os itens do carrinho ATUALIZADO
  cart.items.forEach((item, index) => {
    const preco = item.promotional_price || item.price;
    const subtotal = preco * item.quantity;
    totalPedido += subtotal;

    mensagem += `${index + 1}. *${item.name}*\n`;
    mensagem += `   Quantidade: ${item.quantity}\n`;
    mensagem += `   Preço unitário: R$ ${preco.toFixed(2)}\n`;
    mensagem += `   Subtotal: R$ ${subtotal.toFixed(2)}\n\n`;
  });

  // Adicionar frete
  const shippingSelect = document.getElementById("shipping-method");
  let frete = 0;
  let metodoFrete = "Retirada na Loja";

  if (shippingSelect) {
    if (shippingSelect.value === "standard") {
      frete = 15;
      metodoFrete = "Entrega Padrão";
    } else if (shippingSelect.value === "express") {
      frete = 25;
      metodoFrete = "Entrega Expressa";
    }
  }

  mensagem += `*Frete:* ${metodoFrete} - R$ ${frete.toFixed(2)}\n\n`;
  mensagem += `*TOTAL DO PEDIDO: R$ ${(totalPedido + frete).toFixed(2)}*\n\n`;
  mensagem += "Por favor, confirme os dados para finalizarmos o pedido!\n";
  mensagem += "Obrigado!";

  // Codificar para URL
  const mensagemCodificada = encodeURIComponent(mensagem);

  // Número do WhatsApp da loja (SUBSTITUA pelo número real)
  const phoneNumber = "558182047692";

  // Abrir WhatsApp
  window.open(
    `https://wa.me/${phoneNumber}?text=${mensagemCodificada}`,
    "_blank",
  );

  console.log("📤 Mensagem gerada com sucesso!");
  console.log("📊 Carrinho usado:", cart);
}

// Carregar produtos recomendados da API
async function loadRecommendedProducts() {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/products?limit=4&featured=true`,
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

              // Recarregar o carrinho
              await loadCart();
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

// Função auxiliar para mostrar notificações
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#4CAF50" : "#f44336"};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const icon = type === "success" ? "check-circle" : "exclamation-circle";

  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
