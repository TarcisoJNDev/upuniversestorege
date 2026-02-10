// ========== FUNÇÕES DO MODAL DE FILTROS ==========
function setupFiltersModal() {
  const filterToggle = document.getElementById("filterToggle");
  const filtersModal = document.getElementById("filtersModal");
  const filtersClose = document.getElementById("filtersClose");
  const cancelFilters = document.getElementById("cancelFilters");
  const applyAllFilters = document.getElementById("applyAllFilters");
  const clearAllFilters = document.getElementById("clearAllFilters");
  const priceRangeSlider = document.getElementById("priceRangeSlider");
  const priceRangeValue = document.getElementById("priceRangeValue");
  const minPriceInput = document.getElementById("minPriceInput");
  const maxPriceInput = document.getElementById("maxPriceInput");
  const filterCategoriesGrid = document.getElementById("filterCategoriesGrid");
  const filterCount = document.getElementById("filterCount");
  const searchClear = document.getElementById("searchClear");
  const searchInput = document.getElementById("searchInput");

  // Funções para abrir e fechar modal
  function openModal() {
    filtersModal.classList.add("active");
    document.body.classList.add("modal-open"); // Previne scroll no body
    updateFiltersCount();
  }

  function closeModal() {
    filtersModal.classList.remove("active");
    document.body.classList.remove("modal-open"); // Restaura scroll
  }

  // Abrir modal
  filterToggle.addEventListener("click", openModal);

  // Fechar modal
  filtersClose.addEventListener("click", closeModal);
  cancelFilters.addEventListener("click", closeModal);

  // Fechar modal ao clicar fora do conteúdo
  filtersModal.addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // Fechar modal com ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && filtersModal.classList.contains("active")) {
      closeModal();
    }
  });

  // Aplicar filtros
  applyAllFilters.addEventListener("click", () => {
    applyAllFiltersFromModal();
    closeModal();
  });

  // Limpar todos os filtros
  clearAllFilters.addEventListener("click", () => {
    clearAllFiltersHandler();
  });

  // Atualizar slider de preço
  if (priceRangeSlider) {
    priceRangeSlider.addEventListener("input", function () {
      const value = this.value;
      priceRangeValue.textContent = `R$ ${value}`;
      if (maxPriceInput) {
        maxPriceInput.value = value;
      }
    });

    priceRangeSlider.addEventListener("change", function () {
      currentFilters.maxPrice = parseInt(this.value);
    });
  }

  // Inputs de preço
  if (minPriceInput) {
    minPriceInput.addEventListener("change", function () {
      const value = parseInt(this.value) || 0;
      currentFilters.minPrice = value;
      if (priceRangeSlider && value > parseInt(priceRangeSlider.value)) {
        priceRangeSlider.value = value;
        priceRangeValue.textContent = `R$ ${value}`;
      }
    });
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener("change", function () {
      const value = parseInt(this.value) || 1000;
      currentFilters.maxPrice = value;
      if (priceRangeSlider) {
        priceRangeSlider.value = value;
        priceRangeValue.textContent = `R$ ${value}`;
      }
    });
  }

  // Carregar categorias no modal
  if (filterCategoriesGrid && allCategories && allCategories.length > 0) {
    const sortedCategories = [...allCategories].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    filterCategoriesGrid.innerHTML = sortedCategories
      .map((category) => {
        const productsInCategory = allProducts.filter(
          (p) =>
            (p.category_id &&
              p.category_id.toString() === category.id.toString()) ||
            (p.category &&
              p.category.toLowerCase() === category.name.toLowerCase()),
        ).length;

        return `
        <div class="filter-category" data-category-id="${category.id}">
          <input type="checkbox" name="category" value="${category.id}">
          <div class="filter-category-content">
            <div class="filter-category-icon">
              ${category.icon || '<i class="fas fa-tag"></i>'}
            </div>
            <div class="filter-category-text">
              <h5>${category.name}</h5>
              <span>${productsInCategory} produto(s)</span>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Adicionar event listeners para categorias
    document.querySelectorAll(".filter-category").forEach((category) => {
      category.addEventListener("click", function () {
        this.classList.toggle("selected");
        updateFiltersCount();
      });
    });
  }

  // Limpar busca
  if (searchClear && searchInput) {
    searchInput.addEventListener("input", function () {
      searchClear.style.display = this.value ? "block" : "none";
    });

    searchClear.addEventListener("click", function () {
      searchInput.value = "";
      searchClear.style.display = "none";
      currentFilters.searchTerm = "";
      applyFilters();
    });
  }
}

function applyAllFiltersFromModal() {
  // Coletar categorias selecionadas
  const selectedCategories = [];
  document.querySelectorAll(".filter-category.selected").forEach((cat) => {
    selectedCategories.push(cat.dataset.categoryId);
  });

  // Se nenhuma categoria selecionada, mostrar todas
  currentFilters.categories =
    selectedCategories.length > 0 ? selectedCategories : [];

  // Coletar ordenação
  const selectedSort = document.querySelector('input[name="sortBy"]:checked');
  if (selectedSort) {
    currentFilters.sortBy = selectedSort.value;
  }

  // Coletar status
  const selectedStatus = [];
  document
    .querySelectorAll('input[name="status"]:checked')
    .forEach((status) => {
      selectedStatus.push(status.value);
    });
  currentFilters.status = selectedStatus;

  // Atualizar contador de filtros
  updateFiltersCount();

  // Aplicar filtros
  applyFilters();
}

function clearAllFiltersHandler() {
  // Resetar categorias
  document.querySelectorAll(".filter-category").forEach((cat) => {
    cat.classList.remove("selected");
  });

  // Resetar status
  document.querySelectorAll('input[name="status"]').forEach((status) => {
    status.checked = status.value === "in_stock";
  });

  // Resetar ordenação
  document.querySelector('input[name="sortBy"][value="newest"]').checked = true;

  // Resetar preço
  const priceSlider = document.getElementById("priceRangeSlider");
  const minInput = document.getElementById("minPriceInput");
  const maxInput = document.getElementById("maxPriceInput");

  if (priceSlider) priceSlider.value = 1000;
  if (minInput) minInput.value = "";
  if (maxInput) maxInput.value = "";

  // Resetar variáveis
  currentFilters = {
    categories: [],
    minPrice: 0,
    maxPrice: 1000,
    sortBy: "newest",
    searchTerm: "",
    status: ["in_stock"],
  };

  // Atualizar UI
  updateFiltersCount();
  document.getElementById("priceRangeValue").textContent = "R$ 1000";
}

function updateFiltersCount() {
  const count = document.querySelectorAll(".filter-category.selected").length;
  const filterCountElement = document.getElementById("filterCount");
  if (filterCountElement) {
    filterCountElement.textContent = count;
    filterCountElement.style.display = count > 0 ? "inline-block" : "none";
  }
}

// ========== FUNÇÕES AUXILIARES ==========
function showNoProductsMessage() {
  document.getElementById("productsGrid").innerHTML = `
          <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <i class="fas fa-box-open fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Catálogo vazio</h3>
            <p style="color: #888;">Não há produtos disponíveis no momento.</p>
          </div>
        `;

  document.getElementById("productCount").textContent =
    "0 produtos encontrados";
  document.getElementById("pagination").style.display = "none";
  document.getElementById("featuredCategories").style.display = "none";
}

function showError(message) {
  document.getElementById("productsGrid").innerHTML = `
          <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <i class="fas fa-exclamation-triangle fa-3x" style="color: #f44336; margin-bottom: 20px;"></i>
            <h3 style="color: #666; margin-bottom: 10px;">Ops! Algo deu errado</h3>
            <p style="color: #888;">${message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #7C3AED; color: white; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
          </div>
        `;
}
// ========== INICIALIZAÇÃO ==========
    // Chame esta função logo após o DOM carregar
    document.addEventListener('DOMContentLoaded', function () {
        console.log("🚀 Catálogo iniciado");

        // Inicializar o catálogo
        initializeCatalog().then(() => {
          // Verificar filtro da home
          checkHomeCategoryFilter();
        });
        setupScrollAnimation();
      });