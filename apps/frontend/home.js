// ============================================
// ===== FUNÇÕES AUXILIARES (SEM REDECLARAR IS_LOCALHOST) =====
// ============================================
// No início do home.js
console.log("🔍 TESTE - window.API_CONFIG existe?", !!window.API_CONFIG);
console.log("🔍 TESTE - window.API_CONFIG.BASE_URL:", window.API_CONFIG?.BASE_URL);
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  }
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/"))
    return `https://upuniversestorege.onrender.com${imagePath}`;
  return `https://upuniversestorege.onrender.com/uploads/${imagePath}`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price || 0);
}

// Cache de categorias
let categoriesCache = [];

function getCategoryName(categoryId) {
  if (!categoryId) return "Sem categoria";
  const category = categoriesCache.find((c) => c.id == categoryId);
  return category ? category.name : "Sem categoria";
}

// ============================================
// ===== FUNÇÕES DE API (USANDO API_CONFIG.BASE_URL) =====
// ============================================
async function fetchProducts() {
  try {
    console.log("📥 Buscando produtos da API...");
    const response = await fetch(`${API_CONFIG.BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products || [];

    // Filtrar apenas produtos ativos e com estoque
    const activeProducts = products.filter(
      (p) => p.status === "active" && p.stock > 0,
    );

    // Ordenar por preço (menor para maior) e pegar 4 primeiros
    const cheapestProducts = activeProducts
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, 4);

    console.log(
      `✅ ${cheapestProducts.length} produtos carregados para a home`,
    );
    return cheapestProducts;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    return [];
  }
}

async function fetchCategories() {
  try {
    console.log("🏷️ Buscando categorias da API...");
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/categories/with-count`,
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    const categories = data.categories || [];

    // Filtrar apenas categorias ativas e com produtos
    const activeCategories = categories.filter(
      (c) => c.status === "active" && c.product_count > 0,
    );

    // Ordenar por número de produtos (maior para menor) e pegar 4 primeiras
    const topCategories = activeCategories
      .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
      .slice(0, 4);

    console.log(`✅ ${topCategories.length} categorias carregadas para a home`);
    return topCategories;
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);

    // Fallback para categorias simples
    try {
      const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/categories`);
      const fallbackData = await fallbackResponse.json();
      const categories = fallbackData.categories || [];

      // Contar produtos manualmente
      const productsResponse = await fetch(`${API_CONFIG.BASE_URL}/products`);
      const productsData = await productsResponse.json();
      const products = productsData.products || [];

      const categoriesWithCount = categories.map((cat) => {
        const count = products.filter((p) => p.category_id == cat.id).length;
        return { ...cat, product_count: count };
      });

      const activeCategories = categoriesWithCount.filter(
        (c) => c.status === "active" && c.product_count > 0,
      );

      return activeCategories
        .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
        .slice(0, 4);
    } catch (fallbackError) {
      console.error("❌ Fallback também falhou:", fallbackError);
      return [];
    }
  }
}

// ============================================
// ===== FUNÇÕES DE RENDERIZAÇÃO =====
// ============================================
function renderFeaturedProducts(products) {
  const productsGrid = document.getElementById("featuredProductsGrid");

  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
          <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-box-open fa-2x" style="color: #ddd; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Nenhum produto disponível</h3>
            <p style="color: #888;">Em breve teremos novidades!</p>
          </div>
        `;
    return;
  }

  let productsHTML = "";

  products.forEach((product) => {
    const imageUrl = getImageUrl(product.image_url);
    const formattedPrice = formatPrice(product.price);
    const inStock = product.stock > 0 && product.status === "active";
    const addToCartClass = inStock ? "btn-primary" : "btn-primary disabled";
    const addToCartDisabled = !inStock ? "disabled" : "";
    const addToCartText = inStock ? "Comprar" : "Esgotado";

    let badgeHTML = "";
    if (product.featured) {
      badgeHTML = '<span class="badge featured">Destaque</span>';
    } else if (
      product.promotional_price &&
      product.promotional_price < product.price
    ) {
      badgeHTML = '<span class="badge">Oferta</span>';
    }

    const shortDescription =
      product.short_description ||
      product.description ||
      "Produto impresso em 3D com qualidade premium e design exclusivo.";
    const truncatedDesc =
      shortDescription.length > 80
        ? shortDescription.substring(0, 80) + "..."
        : shortDescription;

    productsHTML += `
          <li class="product-item">
            <article class="product-card">
              ${badgeHTML}
              <figure class="product-image">
                <img src="${imageUrl}" alt="${product.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
              </figure>
              <section class="product-details">
                <div class="product-header">
                  <h3 class="product-title">${product.name}</h3>
                  <span class="product-category-badge">${getCategoryName(product.category_id)}</span>
                </div>
                <p class="product-description">${truncatedDesc}</p>
                <div class="price-container">
                  <div class="price">${formattedPrice}</div>
                </div>
                <footer class="card-actions">
                  <button class="${addToCartClass}" ${addToCartDisabled} onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> ${addToCartText}
                  </button>
                  <button class="btn-secondary" onclick="viewProductDetails(${product.id})">
                    <i class="fas fa-eye"></i> Detalhes
                  </button>
                </footer>
              </section>
            </article>
          </li>
        `;
  });

  productsGrid.innerHTML = productsHTML;
}

function renderCategories(categories) {
  const categoriesGrid = document.getElementById("categoriesGrid");

  if (!categories || categories.length === 0) {
    categoriesGrid.innerHTML = `
          <a href="catalogo.html" class="category-card" onclick="filterByCategory('all')">
            <div class="category-icon"><i class="fas fa-tags"></i></div>
            <h3>Todas Categorias</h3>
            <p>Explore nosso catálogo completo</p>
          </a>
          <a href="catalogo.html" class="category-card" onclick="filterByCategory('featured')">
            <div class="category-icon"><i class="fas fa-star"></i></div>
            <h3>Em Destaque</h3>
            <p>Produtos mais populares</p>
          </a>
          <a href="catalogo.html" class="category-card" onclick="filterByCategory('new')">
            <div class="category-icon"><i class="fas fa-bolt"></i></div>
            <h3>Novidades</h3>
            <p>Últimos lançamentos</p>
          </a>
          <a href="catalogo.html" class="category-card" onclick="filterByCategory('exclusive')">
            <div class="category-icon"><i class="fas fa-gem"></i></div>
            <h3>Exclusivos</h3>
            <p>Peças únicas e especiais</p>
          </a>
        `;
    return;
  }

  let categoriesHTML = "";

  categories.forEach((category) => {
    let iconHTML = category.icon || '<i class="fas fa-tag"></i>';
    let iconClass = "";

    if (
      iconHTML.includes("🏺") ||
      iconHTML.includes("🏠") ||
      iconHTML.includes("🔧") ||
      iconHTML.includes("🧸") ||
      iconHTML.includes("⚙️") ||
      iconHTML.includes("🧪") ||
      iconHTML.includes("🎨") ||
      iconHTML.includes("🎮")
    ) {
      iconClass = "emoji-icon";
    }

    if (iconHTML.includes("fa-")) {
      iconHTML = `<i class="fas ${iconHTML}"></i>`;
    }

    const productCount = category.product_count || 0;
    const description =
      productCount > 0
        ? `${productCount} produto(s) disponíveis`
        : category.description || "Produtos incríveis";

    categoriesHTML += `
          <a href="catalogo.html" class="category-card" onclick="filterByCategory(${category.id}, '${category.name}')">
            <div class="category-icon ${iconClass}" style="color: ${category.color || "#C084FC"}">
              ${iconHTML}
            </div>
            <h3>${category.name}</h3>
            <p>${description}</p>
          </a>
        `;
  });

  categoriesGrid.innerHTML = categoriesHTML;
}

// ============================================
// ===== FUNÇÕES DE INTERAÇÃO =====
// ============================================
async function addToCart(productId) {
  console.log("🛒 Adicionando ao carrinho:", productId);

  try {
    const result = await cartManager.addToCart(productId, 1);

    if (result.success) {
      showNotification("✅ Produto adicionado ao carrinho!", "success");
      cartManager.updateCartCount();
      showAddToCartModal();
    } else {
      showNotification("❌ Erro ao adicionar produto", "error");
    }
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    showNotification("❌ Erro ao adicionar produto", "error");
  }
}

function viewProductDetails(productId) {
  window.location.href = `detalhes-produto.html?id=${productId}`;
}

function filterByCategory(categoryId, categoryName) {
  if (categoryId === "all") {
    localStorage.removeItem("categoryFilter");
    window.location.href = "catalogo.html";
    return;
  }

  const filterData = {
    categoryId: categoryId,
    categoryName: categoryName || "Categoria",
    timestamp: Date.now(),
  };
  localStorage.setItem("categoryFilter", JSON.stringify(filterData));
  window.location.href = "catalogo.html";
}

// ============================================
// ===== FUNÇÕES DE UI =====
// ============================================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
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

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
        ? "exclamation-circle"
        : "info-circle";

  notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showAddToCartModal() {
  const modal = document.getElementById("cart-confirmation-modal");
  if (modal) modal.style.display = "flex";
}

window.closeAddToCartModal = function () {
  const modal = document.getElementById("cart-confirmation-modal");
  if (modal) modal.style.display = "none";
};

document.addEventListener("click", (e) => {
  const modal = document.getElementById("cart-confirmation-modal");
  if (modal && e.target === modal) closeAddToCartModal();
});

// ============================================
// ===== INICIALIZAÇÃO =====
// ============================================
async function initializeHome() {
  console.log("🚀 Inicializando home...");

  try {
    const [products, categories] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    categoriesCache = categories;
    renderFeaturedProducts(products);
    renderCategories(categories);

    if (cartManager) cartManager.updateCartCount();
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    document.getElementById("featuredProductsGrid").innerHTML = `
          <div class="error-message" style="grid-column:1/-1; text-align:center; padding:60px;">
            <i class="fas fa-exclamation-triangle fa-3x" style="color:#f44336;"></i>
            <h3>Erro ao carregar a página</h3>
            <p>Tente recarregar.</p>
            <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#7C3AED; color:#fff; border:none; border-radius:8px;">
              <i class="fas fa-sync-alt"></i> Recarregar
            </button>
          </div>
        `;
  }
}

// ============================================
// ===== CAROUSEL E SCROLL =====
// ============================================
function initCarousel() {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  let currentSlide = 0;
  let slideInterval;

  function showSlide(n) {
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }
  function prevSlide() {
    showSlide(currentSlide - 1);
  }
  function startCarousel() {
    slideInterval = setInterval(nextSlide, 5000);
  }
  function stopCarousel() {
    clearInterval(slideInterval);
  }

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      prevSlide();
      stopCarousel();
      startCarousel();
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      nextSlide();
      stopCarousel();
      startCarousel();
    });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      showSlide(i);
      stopCarousel();
      startCarousel();
    });
  });

  const container = document.querySelector(".carousel-container");
  if (container) {
    container.addEventListener("mouseenter", stopCarousel);
    container.addEventListener("mouseleave", startCarousel);
  }
  startCarousel();
}

function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach(
        (e) => e.isIntersecting && e.target.classList.add("active"),
      ),
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );
  reveals.forEach((r) => observer.observe(r));
}

function initNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showNotification("📧 Inscrição realizada!", "success");
      form.reset();
    });
  }
}

// ============================================
// ===== START =====
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  initCarousel();
  initScrollReveal();
  initNewsletter();
  initializeHome();
});
