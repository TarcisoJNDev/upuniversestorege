// ============================================
// ===== CONFIGURAÇÃO DA API (USANDO API_CONFIG) =====
// ============================================
console.log("🚀 Catálogo iniciado");
console.log("🌐 API Base URL:", API_CONFIG?.BASE_URL);

const PRODUCTS_PER_PAGE = 9;

// ============================================
// ===== VARIÁVEIS GLOBAIS =====
// ============================================
let allProducts = [];
let allCategories = [];
let filteredProducts = [];
let currentPage = 1;
let currentView = "grid";
let currentFilters = {
  categoryId: null,
  searchTerm: "",
  minPrice: 0,
  maxPrice: 1000,
  inStockOnly: true,
  featuredOnly: false,
  sortBy: "newest",
};

// ============================================
// ===== FUNÇÕES DE API =====
// ============================================
async function fetchProducts() {
  try {
    console.log("📥 Buscando produtos da API...");
    const response = await fetch(`${API_CONFIG.BASE_URL}/products`);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ${data.products?.length || 0} produtos carregados`);
    return data.products || [];
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    return [];
  }
}

async function fetchCategories() {
  try {
    console.log("🏷️ Buscando categorias da API...");
    const response = await fetch(`${API_CONFIG.BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ ${data.categories?.length || 0} categorias carregadas`);
    return data.categories || [];
  } catch (error) {
    console.error("❌ Erro ao buscar categorias:", error);
    return [];
  }
}

// ============================================
// ===== FUNÇÕES AUXILIARES =====
// ============================================
function getImageUrl(imagePath) {
  if (!imagePath)
    return "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
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

function getCategoryName(categoryId) {
  if (!categoryId) return "Sem categoria";
  const category = allCategories.find((c) => c.id == categoryId);
  return category ? category.name : "Sem categoria";
}

// ============================================
// ===== FUNÇÕES DE RENDERIZAÇÃO =====
// ============================================
function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.productId = product.id;

  // Badge de destaque (descomentado)
  if (product.featured) {
    const badge = document.createElement("span");
    badge.className = "badge featured";
    badge.innerHTML = '<i class="fas fa-star"></i> Destaque';
    article.appendChild(badge);
  }

  // Imagem
  const figure = document.createElement("figure");
  figure.className = "product-image";
  const img = document.createElement("img");
  img.src = getImageUrl(product.image_url);
  img.alt = product.name;
  img.loading = "lazy";
  img.onerror = function () {
    this.src =
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
  };
  figure.appendChild(img);
  article.appendChild(figure);

  // Detalhes
  const section = document.createElement("section");
  section.className = "product-details";

  // Header
  const headerDiv = document.createElement("div");
  headerDiv.className = "product-header";

  const title = document.createElement("h3");
  title.className = "product-title";
  title.textContent = product.name;

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "product-category-badge";
  categoryBadge.innerHTML = `<i class="fas fa-tag"></i> ${getCategoryName(product.category_id)}`;

  headerDiv.appendChild(title);
  headerDiv.appendChild(categoryBadge);
  section.appendChild(headerDiv);

  // Descrição
  if (product.short_description) {
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent =
      product.short_description.length > 80
        ? product.short_description.substring(0, 80) + "..."
        : product.short_description;
    section.appendChild(description);
  }

  // Preço
  const priceContainer = document.createElement("div");
  priceContainer.className = "product-price-container";

  if (product.promotional_price && product.promotional_price < product.price) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "product-old-price";
    oldPrice.textContent = formatPrice(product.price);
    priceContainer.appendChild(oldPrice);

    const price = document.createElement("div");
    price.className = "product-price promotional";
    price.textContent = formatPrice(product.promotional_price);
    priceContainer.appendChild(price);
  } else {
    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = formatPrice(product.price);
    priceContainer.appendChild(price);
  }

  section.appendChild(priceContainer);

  // Ações
  const footer = document.createElement("footer");
  footer.className = "card-actions";

  const inStock = product.stock > 0 && product.status === "active";

  const buyBtn = document.createElement("button");
  buyBtn.className = inStock ? "btn-primary" : "btn-primary disabled";
  buyBtn.disabled = !inStock;
  buyBtn.innerHTML = inStock
    ? '<i class="fas fa-shopping-cart"></i> Comprar'
    : '<i class="fas fa-times-circle"></i> Esgotado';
  buyBtn.onclick = (e) => {
    e.stopPropagation();
    if (inStock) addToCart(product.id);
  };

  const detailsBtn = document.createElement("button");
  detailsBtn.className = "btn-secondary";
  detailsBtn.innerHTML = '<i class="fas fa-eye"></i> Detalhes';
  detailsBtn.onclick = (e) => {
    e.stopPropagation();
    viewProductDetails(product.id);
  };

  footer.appendChild(buyBtn);
  footer.appendChild(detailsBtn);
  section.appendChild(footer);

  article.appendChild(section);

  // Tornar o card inteiro clicável
  article.addEventListener("click", () => viewProductDetails(product.id));

  return article;
}

function createCategoryCard(category) {
  const productCount = allProducts.filter(
    (p) => p.category_id == category.id,
  ).length;
  const icon = category.icon
    ? category.icon.includes("fa-")
      ? `<i class="fas ${category.icon}"></i>`
      : category.icon
    : "🏷️";

  return `
        <div class="category-card" data-category-id="${category.id}" data-category-name="${category.name}">
          <div class="category-icon" style="color: ${category.color || "#7C3AED"}">
            ${icon}
          </div>
          <div class="category-content">
            <h3>${category.name}</h3>
            <p>${productCount} produto(s)</p>
          </div>
        </div>
      `;
}

// ============================================
// ===== FUNÇÕES DE FILTRAGEM =====
// ============================================
function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    // Apenas produtos ativos
    if (product.status !== "active") return false;

    // Filtro por categoria
    if (
      currentFilters.categoryId &&
      product.category_id != currentFilters.categoryId
    ) {
      return false;
    }

    // Filtro por busca
    if (currentFilters.searchTerm) {
      const term = currentFilters.searchTerm.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(term);
      const matchesDesc = product.description?.toLowerCase().includes(term);
      const matchesShortDesc = product.short_description
        ?.toLowerCase()
        .includes(term);
      if (!matchesName && !matchesDesc && !matchesShortDesc) return false;
    }

    // Filtro por preço
    const price = product.promotional_price || product.price;
    if (price < currentFilters.minPrice || price > currentFilters.maxPrice)
      return false;

    // Filtro por estoque
    if (currentFilters.inStockOnly && product.stock <= 0) return false;

    // Filtro por destaque
    if (currentFilters.featuredOnly && !product.featured) return false;

    return true;
  });

  // Ordenação
  filteredProducts.sort((a, b) => {
    const priceA = a.promotional_price || a.price;
    const priceB = b.promotional_price || b.price;

    switch (currentFilters.sortBy) {
      case "price_asc":
        return priceA - priceB;
      case "price_desc":
        return priceB - priceA;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "newest":
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  currentPage = 1;
  updateFilterCount();
  renderProducts();
  renderPagination();
}

function updateFilterCount() {
  const count = Object.values(currentFilters).filter(
    (v) => v && v !== 0 && v !== "" && v !== 1000,
  ).length;
  document.getElementById("filterCount").textContent = count > 0 ? count : "";
}

// ============================================
// ===== FUNÇÕES DE RENDERIZAÇÃO =====
// ============================================
function renderProducts() {
  const productsGrid = document.getElementById("productsGrid");
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const pageProducts = filteredProducts.slice(start, end);

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
          <div class="no-products">
            <i class="fas fa-search fa-3x"></i>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente ajustar os filtros ou buscar por outros termos</p>
            <button class="btn-primary" onclick="resetFilters()">
              <i class="fas fa-undo"></i> Limpar Filtros
            </button>
          </div>
        `;
    document.getElementById("pagination").style.display = "none";
  } else {
    productsGrid.innerHTML = "";
    pageProducts.forEach((product) => {
      productsGrid.appendChild(createProductCard(product));
    });
    document.getElementById("pagination").style.display = "flex";
  }

  updateProductCount();
}

function renderQuickFilters() {
  const quickFilters = document.getElementById("quickFilters");

  // Manter o botão "Todos" - já existe no HTML, só garantir que está lá
  quickFilters.innerHTML =
    '<button class="quick-filter active" data-category="all">Todos</button>';

  // ADICIONAR O EVENTO DO BOTÃO "TODOS" AQUI
  const allButton = quickFilters.querySelector('[data-category="all"]');
  if (allButton) {
    allButton.addEventListener("click", loadAllProducts);
  }

  // Adicionar os botões das categorias
  allCategories.slice(0, 6).forEach((category) => {
    const button = document.createElement("button");
    button.className = "quick-filter";
    button.dataset.categoryId = category.id;
    button.innerHTML = `<i class="fas fa-tag"></i> ${category.name}`;

    button.addEventListener("click", () => {
      document
        .querySelectorAll(".quick-filter")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilters.categoryId = parseInt(button.dataset.categoryId);
      applyFilters();
    });

    quickFilters.appendChild(button);
  });
}

function renderCategories() {
  const categoriesGrid = document.getElementById("categoriesGrid");

  if (allCategories.length === 0) {
    categoriesGrid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center;">Nenhuma categoria disponível</p>';
    return;
  }

  categoriesGrid.innerHTML = allCategories
    .filter((c) => c.status !== "inactive")
    .map(createCategoryCard)
    .join("");

  // Adicionar evento de clique nas categorias
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.dataset.categoryId;
      currentFilters.categoryId = parseInt(categoryId);
      applyFilters();

      // Rolar até os produtos
      document
        .querySelector(".catalog-content")
        .scrollIntoView({ behavior: "smooth" });

      // Atualizar botão ativo nos filtros rápidos
      document.querySelectorAll(".quick-filter").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.categoryId == categoryId) {
          btn.classList.add("active");
        }
      });
    });
  });
}

function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  document.getElementById("totalPages").textContent = totalPages;
  document.getElementById("currentPage").textContent = currentPage;

  const pageNumbers = document.getElementById("pageNumbers");
  pageNumbers.innerHTML = "";

  if (totalPages <= 1) {
    document.getElementById("pagination").style.display = "none";
    return;
  }

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.className = `page-number ${i === currentPage ? "active" : ""}`;
    button.textContent = i;
    button.onclick = () => goToPage(i);
    pageNumbers.appendChild(button);
  }

  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages;
}

function updateProductCount() {
  const total = filteredProducts.length;
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const end = Math.min(currentPage * PRODUCTS_PER_PAGE, total);

  document.getElementById("productCount").textContent =
    total > 0
      ? `${start}-${end} de ${total} produtos`
      : "Nenhum produto encontrado";
}

// ============================================
// ===== FUNÇÕES DE NAVEGAÇÃO =====
// ============================================
function goToPage(page) {
  if (page < 1 || page > Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
    return;
  currentPage = page;
  renderProducts();
  renderPagination();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function viewProductDetails(productId) {
  window.location.href = `detalhes-produto.html?id=${productId}`;
}

async function addToCart(productId) {
  console.log("🛒 Adicionando ao carrinho:", productId);

  try {
    const result = await cartManager.addToCart(productId, 1);

    if (result.success) {
      showNotification("✅ Produto adicionado ao carrinho!", "success");
      cartManager.updateCartCount();
      showAddToCartModal();
    } else {
      showNotification(
        "❌ Erro ao adicionar produto: " + result.message,
        "error",
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    showNotification("❌ Erro ao adicionar produto", "error");
  }
}

function updateCartCount() {
  const cart = cartManager.getCart();
  document.getElementById("cartCount").textContent = cart.count;
}

function resetFilters() {
  currentFilters = {
    categoryId: null,
    searchTerm: "",
    minPrice: 0,
    maxPrice: 1000,
    inStockOnly: true,
    featuredOnly: false,
    sortBy: "newest",
  };

  document.getElementById("searchInput").value = "";
  document.getElementById("minPrice").value = 0;
  document.getElementById("maxPrice").value = 1000;
  document.getElementById("inStockOnly").checked = true;
  document.getElementById("featuredOnly").checked = false;
  document.getElementById("sortSelect").value = "newest";

  document.querySelectorAll(".quick-filter").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.category === "all") btn.classList.add("active");
  });

  applyFilters();
}

// ============================================
// ===== FUNÇÕES DE UI =====
// ============================================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : "info-circle"}"></i>
        <span>${message}</span>
      `;

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#4CAF50" : "#2196F3"};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
      `;

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

function showLoading() {
  document.getElementById("productsGrid").innerHTML = `
        <div class="loading-products" style="grid-column: 1/-1; text-align: center; padding: 60px;">
          <i class="fas fa-spinner fa-spin fa-3x" style="color: #7C3AED;"></i>
          <p style="margin-top: 20px;">Carregando produtos...</p>
        </div>
      `;
}

function showError(message) {
  document.getElementById("productsGrid").innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
          <i class="fas fa-exclamation-triangle fa-3x" style="color: #f44336;"></i>
          <h3 style="margin: 20px 0;">Erro ao carregar</h3>
          <p style="color: #666; margin-bottom: 20px;">${message}</p>
          <button onclick="window.location.reload()" class="btn-primary">
            <i class="fas fa-sync-alt"></i> Tentar novamente
          </button>
        </div>
      `;
}

// ============================================
// ===== INICIALIZAÇÃO =====
// ============================================
async function initializeCatalog() {
  showLoading();

  try {
    // Carregar dados da API
    const [products, categories] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ]);

    allProducts = products;
    allCategories = categories;

    if (allProducts.length === 0) {
      document.getElementById("productsGrid").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
              <i class="fas fa-box-open fa-3x" style="color: #aaa;"></i>
              <h3 style="margin: 20px 0; color: #666;">Nenhum produto disponível</h3>
              <p style="color: #888;">Em breve teremos novidades!</p>
            </div>
          `;
      return;
    }

    // Renderizar interface
    renderQuickFilters();
    renderCategories();
    applyFilters();
    setupFiltersModal();

    // Atualizar contador do carrinho
    if (cartManager) {
      cartManager.updateCartCount();
    }

    console.log(`✅ Catálogo inicializado com ${allProducts.length} produtos`);
  } catch (error) {
    console.error("❌ Erro na inicialização:", error);
    showError(error.message);
  }
}

// ============================================
// ===== EVENT LISTENERS =====
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  initializeCatalog();

  // Scroll reveal
  const revealElements = document.querySelectorAll(".reveal");
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    revealElements.forEach((el) => {
      const revealTop = el.getBoundingClientRect().top;
      if (revealTop < windowHeight - 100) {
        el.classList.add("active");
      }
    });
  };
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();

  // Busca
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.searchTerm = this.value;
      applyFilters();

      // Mostrar botão de limpar
      document.getElementById("searchClear").style.display = this.value
        ? "flex"
        : "none";
    }, 500);
  });

  document.getElementById("searchClear").addEventListener("click", function () {
    searchInput.value = "";
    this.style.display = "none";
    currentFilters.searchTerm = "";
    applyFilters();
  });

  // Ordenação
  document.getElementById("sortSelect").addEventListener("change", function () {
    currentFilters.sortBy = this.value;
    applyFilters();
  });

  // Visualização (grid/lista)
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".view-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const view = this.dataset.view;
      document.getElementById("productsGrid").className =
        `products-grid ${view}-view`;
    });
  });

  // Paginação
  document
    .getElementById("prevBtn")
    .addEventListener("click", () => goToPage(currentPage - 1));
  document
    .getElementById("nextBtn")
    .addEventListener("click", () => goToPage(currentPage + 1));

  // Modal de filtros
  const filterModal = document.getElementById("filtersModal");

  document.getElementById("filterToggle").addEventListener("click", () => {
    filterModal.classList.add("show");
  });

  document.getElementById("filtersClose").addEventListener("click", () => {
    filterModal.classList.remove("show");
  });

  document.getElementById("cancelFilters").addEventListener("click", () => {
    filterModal.classList.remove("show");
  });

  document.getElementById("applyAllFilters").addEventListener("click", () => {
    currentFilters.minPrice =
      parseFloat(document.getElementById("minPrice").value) || 0;
    currentFilters.maxPrice =
      parseFloat(document.getElementById("maxPrice").value) || 1000;
    currentFilters.inStockOnly = document.getElementById("inStockOnly").checked;
    currentFilters.featuredOnly =
      document.getElementById("featuredOnly").checked;

    applyFilters();
    filterModal.classList.remove("show");
  });

  document.getElementById("clearAllFilters").addEventListener("click", () => {
    document.getElementById("minPrice").value = 0;
    document.getElementById("maxPrice").value = 1000;
    document.getElementById("inStockOnly").checked = true;
    document.getElementById("featuredOnly").checked = false;

    currentFilters.minPrice = 0;
    currentFilters.maxPrice = 1000;
    currentFilters.inStockOnly = true;
    currentFilters.featuredOnly = false;

    applyFilters();
  });

  // Newsletter
  document.getElementById("newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value;
    showNotification("📧 Inscrição realizada com sucesso!", "success");
    e.target.reset();
  });
});

// ============================================
// ===== FUNÇÕES ADICIONAIS PARA O MODAL =====
// ============================================

// Função para carregar categorias no modal
function loadFilterCategories() {
  const filterCategoriesGrid = document.getElementById("filterCategoriesGrid");
  if (!filterCategoriesGrid || !allCategories.length) return;

  filterCategoriesGrid.innerHTML = allCategories
    .map((category) => {
      const productCount = allProducts.filter(
        (p) => p.category_id == category.id,
      ).length;
      const icon = category.icon
        ? category.icon.includes("fa-")
          ? `<i class="fas ${category.icon}"></i>`
          : category.icon
        : '<i class="fas fa-tag"></i>';

      return `
      <div class="filter-category" data-category-id="${category.id}">
        <input type="checkbox" name="category" value="${category.id}">
        <div class="filter-category-content">
          <div class="filter-category-icon" style="color: ${category.color || "#7C3AED"}">
            ${icon}
          </div>
          <div class="filter-category-text">
            <h5>${category.name}</h5>
            <span>${productCount} produto(s)</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Adicionar eventos
  document.querySelectorAll(".filter-category").forEach((cat) => {
    cat.addEventListener("click", function (e) {
      if (e.target.type !== "checkbox") {
        const checkbox = this.querySelector("input");
        checkbox.checked = !checkbox.checked;
        this.classList.toggle("selected", checkbox.checked);
        updateFiltersCount();
      }
    });

    const checkbox = cat.querySelector("input");
    checkbox.addEventListener("change", function () {
      cat.classList.toggle("selected", this.checked);
      updateFiltersCount();
    });
  });
}

// Função para carregar todos os produtos (botão "Todos")
function loadAllProducts() {
  console.log("🎯 Carregando todos os produtos");

  currentFilters = {
    categoryId: null,
    searchTerm: "",
    minPrice: 0,
    maxPrice: 1000,
    inStockOnly: true,
    featuredOnly: false,
    sortBy: "newest",
  };

  filteredProducts = [...allProducts];
  currentPage = 1;

  // Ativar visualmente o botão "Todos"
  document.querySelectorAll(".quick-filter").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.category === "all") btn.classList.add("active");
  });

  // Resetar inputs
  document.getElementById("searchInput").value = "";
  document.getElementById("searchClear").style.display = "none";

  if (document.getElementById("minPrice")) {
    document.getElementById("minPrice").value = 0;
  }
  if (document.getElementById("maxPrice")) {
    document.getElementById("maxPrice").value = 1000;
  }

  // Resetar modal se existir
  if (document.getElementById("minPriceInput")) {
    document.getElementById("minPriceInput").value = 0;
    document.getElementById("maxPriceInput").value = 1000;
    document.getElementById("priceRangeSlider").value = 1000;
    document.getElementById("priceRangeValue").textContent = "R$ 1000";
  }

  if (document.getElementById("inStockOnly")) {
    document.getElementById("inStockOnly").checked = true;
  }
  if (document.getElementById("featuredOnly")) {
    document.getElementById("featuredOnly").checked = false;
  }
  if (document.getElementById("sortSelect")) {
    document.getElementById("sortSelect").value = "newest";
  }

  // Desmarcar categorias no modal
  document.querySelectorAll(".filter-category").forEach((cat) => {
    cat.classList.remove("selected");
    const checkbox = cat.querySelector("input");
    if (checkbox) checkbox.checked = false;
  });

  updateFilterCount();
  renderProducts();
  renderPagination();
}

// Função para configurar o modal de filtros
function setupFiltersModal() {
  const filterModal = document.getElementById("filtersModal");
  const filterToggle = document.getElementById("filterToggle");
  const filtersClose = document.getElementById("filtersClose");
  const cancelFilters = document.getElementById("cancelFilters");
  const applyFiltersBtn = document.getElementById("applyAllFilters");
  const clearAllBtn = document.getElementById("clearAllFilters");
  const priceSlider = document.getElementById("priceRangeSlider");
  const priceValue = document.getElementById("priceRangeValue");
  const minInput = document.getElementById("minPriceInput");
  const maxInput = document.getElementById("maxPriceInput");

  if (!filterModal) return;

  // Carregar categorias no modal
  loadFilterCategories();

  // Abrir modal
  filterToggle.addEventListener("click", () => {
    filterModal.classList.add("active");
    document.body.classList.add("modal-open");

    // Sincronizar valores atuais
    if (minInput) minInput.value = currentFilters.minPrice;
    if (maxInput) maxInput.value = currentFilters.maxPrice;
    if (priceSlider) priceSlider.value = currentFilters.maxPrice;
    if (priceValue) priceValue.textContent = `R$ ${currentFilters.maxPrice}`;

    // Sincronizar categorias selecionadas
    document.querySelectorAll(".filter-category").forEach((cat) => {
      const catId = cat.dataset.categoryId;
      const checkbox = cat.querySelector("input");
      if (
        currentFilters.categoryId &&
        currentFilters.categoryId.toString() === catId
      ) {
        checkbox.checked = true;
        cat.classList.add("selected");
      } else {
        checkbox.checked = false;
        cat.classList.remove("selected");
      }
    });

    // Sincronizar status
    if (document.getElementById("inStockOnly")) {
      document.getElementById("inStockOnly").checked =
        currentFilters.inStockOnly;
    }
    if (document.getElementById("featuredOnly")) {
      document.getElementById("featuredOnly").checked =
        currentFilters.featuredOnly;
    }

    // Sincronizar ordenação
    if (
      document.querySelector(
        `input[name="sortBy"][value="${currentFilters.sortBy}"]`,
      )
    ) {
      document.querySelector(
        `input[name="sortBy"][value="${currentFilters.sortBy}"]`,
      ).checked = true;
    }
  });

  // Fechar modal
  [filtersClose, cancelFilters].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", () => {
        filterModal.classList.remove("active");
        document.body.classList.remove("modal-open");
      });
    }
  });

  // Fechar ao clicar fora
  filterModal.addEventListener("click", (e) => {
    if (e.target === filterModal) {
      filterModal.classList.remove("active");
      document.body.classList.remove("modal-open");
    }
  });

  // Slider de preço
  if (priceSlider) {
    priceSlider.addEventListener("input", function () {
      if (priceValue) priceValue.textContent = `R$ ${this.value}`;
      if (maxInput) maxInput.value = this.value;
    });
  }

  if (minInput) {
    minInput.addEventListener("change", function () {
      const min = parseFloat(this.value) || 0;
      const max = parseFloat(maxInput?.value) || 1000;
      if (min > max && maxInput) maxInput.value = min;
    });
  }

  if (maxInput) {
    maxInput.addEventListener("change", function () {
      const max = parseFloat(this.value) || 1000;
      if (priceSlider) priceSlider.value = max;
      if (priceValue) priceValue.textContent = `R$ ${max}`;
    });
  }

  // Aplicar filtros
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      // Categorias
      const selectedCategory = document.querySelector(
        ".filter-category.selected",
      );
      if (selectedCategory) {
        currentFilters.categoryId = parseInt(
          selectedCategory.dataset.categoryId,
        );
      } else {
        currentFilters.categoryId = null;
      }

      // Preço
      if (minInput) currentFilters.minPrice = parseFloat(minInput.value) || 0;
      if (maxInput)
        currentFilters.maxPrice = parseFloat(maxInput.value) || 1000;

      // Status
      if (document.getElementById("inStockOnly")) {
        currentFilters.inStockOnly =
          document.getElementById("inStockOnly").checked;
      }
      if (document.getElementById("featuredOnly")) {
        currentFilters.featuredOnly =
          document.getElementById("featuredOnly").checked;
      }

      // Ordenação
      const selectedSort = document.querySelector(
        'input[name="sortBy"]:checked',
      );
      if (selectedSort) {
        currentFilters.sortBy = selectedSort.value;
        if (document.getElementById("sortSelect")) {
          document.getElementById("sortSelect").value = selectedSort.value;
        }
      }

      applyFilters();

      // Fechar modal
      filterModal.classList.remove("active");
      document.body.classList.remove("modal-open");
    });
  }

  // Limpar todos
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      // Desmarcar categorias
      document.querySelectorAll(".filter-category").forEach((cat) => {
        cat.classList.remove("selected");
        const checkbox = cat.querySelector("input");
        if (checkbox) checkbox.checked = false;
      });

      // Resetar preço
      if (minInput) minInput.value = 0;
      if (maxInput) maxInput.value = 1000;
      if (priceSlider) priceSlider.value = 1000;
      if (priceValue) priceValue.textContent = "R$ 1000";

      // Resetar status
      if (document.getElementById("inStockOnly")) {
        document.getElementById("inStockOnly").checked = true;
      }
      if (document.getElementById("featuredOnly")) {
        document.getElementById("featuredOnly").checked = false;
      }

      // Resetar ordenação
      if (document.querySelector('input[name="sortBy"][value="newest"]')) {
        document.querySelector('input[name="sortBy"][value="newest"]').checked =
          true;
      }

      // Aplicar reset
      currentFilters.categoryId = null;
      currentFilters.minPrice = 0;
      currentFilters.maxPrice = 1000;
      currentFilters.inStockOnly = true;
      currentFilters.featuredOnly = false;
      currentFilters.sortBy = "newest";

      if (document.getElementById("sortSelect")) {
        document.getElementById("sortSelect").value = "newest";
      }

      applyFilters();
    });
  }
}

// Função para renderizar categorias com imagem
function renderCategoriesWithImages() {
  const categoriesGrid = document.getElementById("categoriesGrid");
  const featuredSection = document.getElementById("featuredCategories");

  if (!categoriesGrid || !featuredSection) return;

  if (allCategories.length === 0 || allProducts.length === 0) {
    featuredSection.style.display = "none";
    return;
  }

  // Calcular categorias com mais produtos
  const categoriesWithCount = allCategories.map((category) => {
    const count = allProducts.filter(
      (p) => p.category_id == category.id,
    ).length;
    return { ...category, count };
  });

  // Pegar top 3 categorias com mais produtos
  const topCategories = categoriesWithCount
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (topCategories.length === 0) {
    featuredSection.style.display = "none";
    return;
  }

  // Para cada categoria, encontrar uma imagem de produto
  categoriesGrid.innerHTML = topCategories
    .map((category) => {
      const productsInCategory = allProducts.filter(
        (p) => p.category_id == category.id,
      );
      let categoryImage =
        "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

      if (productsInCategory.length > 0 && productsInCategory[0].image_url) {
        categoryImage = getImageUrl(productsInCategory[0].image_url);
      }

      const icon = category.icon
        ? category.icon.includes("fa-")
          ? `<i class="fas ${category.icon}"></i>`
          : category.icon
        : "🏷️";

      return `
      <div class="category-card" data-category-id="${category.id}" data-category-name="${category.name}">
        <div class="category-image">
          <img src="${categoryImage}" alt="${category.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
        </div>
        <div class="category-content">
          <div class="category-icon" style="color: ${category.color || "#7C3AED"}">${icon}</div>
          <h3>${category.name}</h3>
          <p>${category.count} produto(s)</p>
        </div>
      </div>
    `;
    })
    .join("");

  featuredSection.style.display = "block";

  // Adicionar eventos de clique
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryId = card.dataset.categoryId;

      // Ativar filtro
      currentFilters.categoryId = parseInt(categoryId);
      applyFilters();

      // Ativar botão nos filtros rápidos
      document.querySelectorAll(".quick-filter").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.categoryId == categoryId) {
          btn.classList.add("active");
        }
      });

      // Rolar para os produtos
      document
        .querySelector(".catalog-content")
        .scrollIntoView({ behavior: "smooth" });
    });
  });
}

// Substituir a função renderCategories original pela nova
renderCategories = renderCategoriesWithImages;

// ============================================
// ===== ANIMAÇÕES CSS =====
// ============================================
const style = document.createElement("style");
style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
      }
      .notification {
        animation: slideIn 0.3s ease;
      }
      .notification.fade-out {
        animation: fadeOut 0.3s ease;
      }
    `;
document.head.appendChild(style);
