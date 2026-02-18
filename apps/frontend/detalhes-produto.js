
    // ============================================
    // ===== CONFIGURAÇÃO DA API (USANDO API_CONFIG) =====
    // ============================================
    console.log('🚀 Detalhes do produto iniciado');
    console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);

    // ============================================
    // ===== VARIÁVEIS GLOBAIS =====
    // ============================================
    let currentProduct = null;
    let allCategories = [];
    let allProducts = [];

    // ============================================
    // ===== FUNÇÕES DE API =====
    // ============================================
    async function fetchProductById(productId) {
      try {
        console.log(`📥 Buscando produto ${productId} da API...`);
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/${productId}`);

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.product;
      } catch (error) {
        console.error("❌ Erro ao buscar produto:", error);
        throw error;
      }
    }

    async function fetchCategories() {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/categories`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        return data.categories || [];
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        return [];
      }
    }

    async function fetchAllProducts() {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/products`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        return data.products || [];
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
      }
    }

    async function fetchRelatedProducts(categoryId, currentProductId) {
      try {
        // Buscar produtos da mesma categoria
        const response = await fetch(`${API_CONFIG.BASE_URL}/products/category-id/${categoryId}`);
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        const products = data.products || [];

        // Filtrar o produto atual e pegar até 4 produtos relacionados
        return products
          .filter(product => product.id !== currentProductId)
          .slice(0, 4);
      } catch (error) {
        console.error("Erro ao buscar produtos relacionados:", error);
        return [];
      }
    }

    // ============================================
    // ===== FUNÇÕES AUXILIARES =====
    // ============================================
    function getImageUrl(imagePath) {
      if (!imagePath) {
        return 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
      }
      if (imagePath.startsWith('http')) return imagePath;
      if (imagePath.startsWith('/')) return `https://upuniversestorege.onrender.com${imagePath}`;
      return `https://upuniversestorege.onrender.com/uploads/${imagePath}`;
    }

    function formatPrice(price) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price || 0).replace('R$', '').trim();
    }

    function getCategoryName(categoryId) {
      if (!categoryId) return 'Sem categoria';
      const category = allCategories.find(c => c.id == categoryId);
      return category ? category.name : 'Sem categoria';
    }

    // ============================================
    // ===== FUNÇÃO PARA RENDERIZAR PRODUTO =====
    // ============================================
    function renderProduct(product) {
      console.log("🎨 Renderizando produto:", product.name);

      // Atualizar título da página
      document.title = `${product.name} - Universo Paralelo Store`;

      // Atualizar breadcrumb
      document.getElementById('productName').textContent = product.name;

      // Encontrar categoria
      let categoryName = getCategoryName(product.category_id);
      document.getElementById('productCategory').textContent = categoryName;

      // Preparar imagens
      const mainImageUrl = getImageUrl(product.image_url);
      const galleryImages = product.images || [];

      // Preparar preço
      const price = product.price || 0;
      const promoPrice = product.promotional_price || null;
      const hasDiscount = promoPrice && promoPrice > 0 && promoPrice < price;

      // Verificar estoque
      const inStock = product.stock > 0 && product.status === 'active';

      // Preparar descrição curta
      const shortDescription = product.short_description || product.description || 'Produto impresso em 3D com qualidade premium e design exclusivo.';

      // Criar HTML do produto
      const productHTML = `
          <div class="product-container">
            
            <!-- Galeria de Imagens -->
            <div class="product-gallery">
              <div class="main-image">
                <img id="mainImage" src="${mainImageUrl}" alt="${product.name}">
                ${product.featured ? '<span class="badge featured">Destaque</span>' : ''}
                ${hasDiscount ? '<span class="badge promotion">Promoção</span>' : ''}
              </div>
  
              <div class="image-thumbnails" id="imageThumbnails">
                <div class="thumbnail active" data-image="${mainImageUrl}">
                  <img src="${mainImageUrl}" alt="Vista principal">
                </div>
                ${galleryImages.map((img, index) => `
                  <div class="thumbnail" data-image="${getImageUrl(img)}">
                    <img src="${getImageUrl(img)}" alt="Imagem ${index + 1}">
                  </div>
                `).join('')}
              </div>
            </div>
  
            <!-- Informações do Produto -->
            <div class="product-info">
              <h1 class="product-title">${product.name}</h1>
  
              <div class="product-rating">
                <div class="stars">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star-half-alt"></i>
                </div>
                <span class="rating-count">(0 avaliações)</span>
                <span style="opacity: 0.7;">•</span>
                <span class="product-category">${categoryName}</span>
              </div>
  
              <p class="product-description">${shortDescription}</p>
  
              <!-- Seção de Preço -->
              <div class="product-price-section">
                ${hasDiscount ? `<div class="original-price">R$ ${formatPrice(price)}</div>` : ''}
                <div class="current-price">R$ ${formatPrice(hasDiscount ? promoPrice : price)}</div>
                ${hasDiscount ? `<span class="discount-badge">Economize R$ ${formatPrice(price - promoPrice)}</span>` : ''}
  
                <div class="stock-info">
                  <i class="fas fa-${inStock ? 'check-circle in-stock' : 'times-circle out-of-stock'}"></i>
                  <span class="${inStock ? 'in-stock' : 'out-of-stock'}">
                    ${inStock ? `Em estoque (${product.stock} unidades)` : 'Esgotado'}
                  </span>
                  ${inStock ? '<span style="opacity: 0.7;">•</span><span>Disponível para envio</span>' : ''}
                </div>
              </div>
  
              <!-- Opções de Personalização (se houver) -->
              ${renderCustomizationOptions(product)}
  
              <!-- Seletor de Quantidade -->
              <div class="quantity-selector">
                <span style="font-weight: 600;">Quantidade:</span>
                <div class="quantity-control">
                  <button class="quantity-btn minus-btn" ${!inStock ? 'disabled' : ''}>
                    <i class="fas fa-minus"></i>
                  </button>
                  <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" ${!inStock ? 'disabled' : ''}>
                  <button class="quantity-btn plus-btn" ${!inStock ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <div style="font-size: 14px; opacity: 0.8;">
                  ${inStock ? `Máximo: ${product.stock} unidades` : 'Indisponível'}
                </div>
              </div>
  
              <!-- Botões de Ação -->
              <div class="product-actions">
                <button class="btn-buy" id="buyNowBtn" ${!inStock ? 'disabled' : ''}>
                  <i class="fas fa-shopping-cart"></i>
                  <span>${inStock ? 'COMPRAR AGORA' : 'ESGOTADO'}</span>
                </button>
                <button class="btn-wishlist" id="wishlistBtn">
                  <i class="far fa-heart"></i>
                  Favoritar
                </button>
              </div>
  
              <!-- Informações Adicionais -->
              <div class="product-meta">
                <div class="meta-item">
                  <div class="meta-icon">
                    <i class="fas fa-truck"></i>
                  </div>
                  <div class="meta-text">
                    <strong>Entrega Rápida</strong>
                    <span>Envio em 2-5 dias úteis</span>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-icon">
                    <i class="fas fa-shield-alt"></i>
                  </div>
                  <div class="meta-text">
                    <strong>Garantia</strong>
                    <span>12 meses contra defeitos</span>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-icon">
                    <i class="fas fa-undo"></i>
                  </div>
                  <div class="meta-text">
                    <strong>Devolução</strong>
                    <span>30 dias para trocas</span>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-icon">
                    <i class="fas fa-cube"></i>
                  </div>
                  <div class="meta-text">
                    <strong>Material</strong>
                    <span>${product.material || 'PLA Premium'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

      // Inserir HTML no container
      document.getElementById('productContainer').innerHTML = productHTML;

      // Mostrar tabs
      document.getElementById('productTabs').style.display = 'block';

      // Renderizar conteúdo das tabs
      renderTabContent(product);

      // Adicionar event listeners
      setupEventListeners(product);
    }

    function renderCustomizationOptions(product) {
      let html = '';

      // Verificar se há variantes de tamanho
      if (product.variants && product.variants.sizes && product.variants.sizes.length > 0) {
        const sizes = product.variants.sizes.filter(s => s.size && s.price);

        if (sizes.length > 0) {
          html += `
              <div class="customization-options">
                <div class="option-group">
                  <div class="option-title">
                    <i class="fas fa-expand-alt"></i>
                    <span>Tamanho</span>
                  </div>
                  <div class="size-options" id="sizeOptions">
            `;

          sizes.forEach((size, index) => {
            html += `
                <div class="size-option ${index === 0 ? 'active' : ''}" data-size="${size.size}" data-price="${size.price || product.price}">
                  <div>${size.size}</div>
                  <div class="size-details">R$ ${formatPrice(size.price || product.price)}</div>
                </div>
              `;
          });

          html += `
                  </div>
                </div>
              </div>
            `;
        }
      }

      // Verificar se há cores
      if (product.variants && product.variants.colors && product.variants.colors.length > 0) {
        const colors = product.variants.colors.filter(c => c);

        if (colors.length > 0) {
          // Mapeamento de cores para códigos hexadecimais aproximados
          const colorMap = {
            'Marrom Pedra': '#8B7355',
            'Terra Queimada': '#A0522D',
            'Cinza Fosco': '#808080',
            'Verde Escuro': '#2F4F4F',
            'Preto Profundo': '#000000',
            'Vermelho': '#FF0000',
            'Azul': '#0000FF',
            'Amarelo': '#FFFF00',
            'Branco': '#FFFFFF',
            'Roxo': '#800080',
            'Laranja': '#FFA500',
            'Rosa': '#FFC0CB'
          };

          html += `
              <div class="customization-options">
                <div class="option-group">
                  <div class="option-title">
                    <i class="fas fa-palette"></i>
                    <span>Cor do Filamento</span>
                  </div>
                  <div class="color-options" id="colorOptions">
            `;

          colors.forEach((color, index) => {
            const colorCode = colorMap[color] || '#7C3AED';
            html += `
                <div class="color-option ${index === 0 ? 'active' : ''}" 
                     style="background: ${colorCode};" 
                     data-color="${color.toLowerCase()}" 
                     data-colorname="${color}">
                  <span class="color-name">${color}</span>
                </div>
              `;
          });

          html += `
                  </div>
                </div>
              </div>
            `;
        }
      }

      return html || ''; // Retorna string vazia se não houver opções
    }

    function renderTabContent(product) {
      // Descrição detalhada
      const detailedDescription = document.getElementById('detailedDescription');
      if (detailedDescription) {
        let descriptionHTML = '';

        if (product.description) {
          descriptionHTML += `<p>${product.description.replace(/\n/g, '<br>')}</p>`;
        } else {
          descriptionHTML += '<p>Não há descrição detalhada disponível para este produto.</p>';
        }

        // Adicionar especificações como lista se houver
        if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
          descriptionHTML += '<h4 style="margin-top: 20px;">Características:</h4><ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">';

          product.specifications.forEach(spec => {
            if (typeof spec === 'string') {
              descriptionHTML += `<li>${spec}</li>`;
            } else if (spec.key && spec.value) {
              descriptionHTML += `<li><strong>${spec.key}:</strong> ${spec.value}</li>`;
            }
          });

          descriptionHTML += '</ul>';
        }

        detailedDescription.innerHTML = descriptionHTML;
      }

      // Especificações técnicas
      const specificationsList = document.getElementById('specificationsList');
      if (specificationsList) {
        let specsHTML = '';

        // Material
        if (product.material) {
          specsHTML += `
              <div class="spec-item">
                <span class="spec-label">Material:</span>
                <span class="spec-value">${product.material}</span>
              </div>
            `;
        }

        // Dimensões
        if (product.dimensions) {
          specsHTML += `
              <div class="spec-item">
                <span class="spec-label">Dimensões:</span>
                <span class="spec-value">${product.dimensions}</span>
              </div>
            `;
        }

        // Peso
        if (product.weight) {
          specsHTML += `
              <div class="spec-item">
                <span class="spec-label">Peso:</span>
                <span class="spec-value">${product.weight}</span>
              </div>
            `;
        }

        // SKU
        if (product.sku) {
          specsHTML += `
              <div class="spec-item">
                <span class="spec-label">SKU:</span>
                <span class="spec-value">${product.sku}</span>
              </div>
            `;
        }

        // Especificações do JSON
        if (product.specifications && Array.isArray(product.specifications)) {
          product.specifications.forEach(spec => {
            if (typeof spec === 'object' && spec.key && spec.value) {
              specsHTML += `
                  <div class="spec-item">
                    <span class="spec-label">${spec.key}:</span>
                    <span class="spec-value">${spec.value}</span>
                  </div>
                `;
            }
          });
        }

        specificationsList.innerHTML = specsHTML || `
            <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #aaa;">
              <i class="fas fa-info-circle fa-2x" style="margin-bottom: 10px;"></i>
              <p>Não há especificações técnicas disponíveis</p>
            </div>
          `;
      }

      // Informações de envio
      const shippingInfo = document.getElementById('shippingInfo');
      if (shippingInfo) {
        let shippingHTML = `
            <p>Entregamos para todo o Brasil com prazos variáveis conforme a região:</p>
            
            <div style="margin: 25px 0;">
              <h4>Prazos estimados:</h4>
              <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Grandes Capitais:</strong> 2-3 dias úteis</li>
                <li><strong>Interior Sudeste:</strong> 3-5 dias úteis</li>
                <li><strong>Nordeste/Norte:</strong> 5-8 dias úteis</li>
                <li><strong>Sul/Centro-Oeste:</strong> 4-6 dias úteis</li>
              </ul>
            </div>
  
            <h4>Opções de frete:</h4>
            <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Econômico:</strong> R$ 15,90 (5-8 dias úteis)</li>
              <li><strong>Padrão:</strong> R$ 22,90 (3-5 dias úteis)</li>
              <li><strong>Expresso:</strong> R$ 34,90 (1-2 dias úteis)</li>
            </ul>
          `;

        // Adicionar informações específicas do produto
        if (product.shipping_info) {
          const shipping = product.shipping_info;

          if (shipping.weight_kg) {
            shippingHTML += `<p style="margin-top: 20px;"><strong>Peso do produto:</strong> ${shipping.weight_kg} kg</p>`;
          }

          if (shipping.dimensions_cm) {
            shippingHTML += `<p><strong>Dimensões da embalagem:</strong> ${shipping.dimensions_cm}</p>`;
          }

          if (shipping.production_time) {
            shippingHTML += `<p><strong>Tempo de produção:</strong> ${shipping.production_time}</p>`;
          }
        }

        shippingHTML += `
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
              <i class="fas fa-info-circle"></i> Produtos personalizados têm prazo adicional de 3-5 dias para produção.
            </p>
          `;

        shippingInfo.innerHTML = shippingHTML;
      }
    }

    // ============================================
    // ===== FUNÇÃO PARA CARREGAR PRODUTOS RELACIONADOS =====
    // ============================================
    async function loadRelatedProducts(product) {
      const relatedGrid = document.getElementById('relatedGrid');
      const relatedSection = document.getElementById('relatedProducts');

      if (!product.category_id) {
        relatedSection.style.display = 'none';
        return;
      }

      try {
        const relatedProducts = await fetchRelatedProducts(product.category_id, product.id);

        if (relatedProducts.length === 0) {
          relatedSection.style.display = 'none';
          return;
        }

        // Mostrar seção
        relatedSection.style.display = 'block';

        // Renderizar produtos relacionados
        relatedGrid.innerHTML = relatedProducts.map(relatedProduct => {
          const relatedImageUrl = getImageUrl(relatedProduct.image_url);
          const relatedPrice = relatedProduct.promotional_price || relatedProduct.price;
          const relatedCategory = getCategoryName(relatedProduct.category_id);

          return `
              <a href="detalhes-produto.html?id=${relatedProduct.id}" class="product-card">
                ${relatedProduct.featured ? '<span class="badge">Destaque</span>' : ''}
                <figure class="product-image">
                  <img src="${relatedImageUrl}" alt="${relatedProduct.name}">
                </figure>
                <section class="product-details">
                  <div class="product-category">${relatedCategory}</div>
                  <h3>${relatedProduct.name}</h3>
                  <p class="price">R$ ${formatPrice(relatedPrice)}</p>
                </section>
              </a>
            `;
        }).join('');

      } catch (error) {
        console.error("Erro ao carregar produtos relacionados:", error);
        relatedSection.style.display = 'none';
      }
    }

    // ============================================
    // ===== FUNÇÃO PARA CONFIGURAR EVENT LISTENERS =====
    // ============================================
    function setupEventListeners(product) {
      // Galeria de imagens
      const thumbnails = document.querySelectorAll('.thumbnail');
      const mainImage = document.getElementById('mainImage');

      if (thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
          thumbnail.addEventListener('click', function () {
            // Remover classe active de todas as thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));

            // Adicionar classe active na thumbnail clicada
            this.classList.add('active');

            // Atualizar imagem principal
            const newImage = this.getAttribute('data-image');
            if (newImage && mainImage) {
              mainImage.src = newImage;
            }
          });
        });
      }

      // Seletor de Tamanho
      const sizeOptions = document.querySelectorAll('.size-option');
      const currentPrice = document.querySelector('.current-price');

      if (sizeOptions.length > 0 && currentPrice) {
        sizeOptions.forEach(option => {
          option.addEventListener('click', function () {
            // Remover classe active de todos
            sizeOptions.forEach(o => o.classList.remove('active'));

            // Adicionar classe active no selecionado
            this.classList.add('active');

            // Atualizar preço
            const newPrice = this.getAttribute('data-price');
            if (newPrice) {
              currentPrice.textContent = `R$ ${formatPrice(parseFloat(newPrice))}`;
            }
          });
        });
      }

      // Seletor de Cor
      const colorOptions = document.querySelectorAll('.color-option');

      if (colorOptions.length > 0) {
        colorOptions.forEach(option => {
          option.addEventListener('click', function () {
            // Remover classe active de todos
            colorOptions.forEach(o => o.classList.remove('active'));

            // Adicionar classe active no selecionado
            this.classList.add('active');
          });
        });
      }

      // Controle de Quantidade
      const quantityInput = document.querySelector('.quantity-input');
      const minusBtn = document.querySelector('.minus-btn');
      const plusBtn = document.querySelector('.plus-btn');

      if (quantityInput && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', function () {
          let currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
          }
        });

        plusBtn.addEventListener('click', function () {
          let currentValue = parseInt(quantityInput.value);
          if (currentValue < product.stock) {
            quantityInput.value = currentValue + 1;
          }
        });

        quantityInput.addEventListener('change', function () {
          let value = parseInt(this.value);
          if (isNaN(value) || value < 1) {
            this.value = 1;
          } else if (value > product.stock) {
            this.value = product.stock;
          }
        });
      }

      // Tabs
      const tabHeaders = document.querySelectorAll('.tab-header');
      const tabContents = document.querySelectorAll('.tab-content');

      if (tabHeaders.length > 0) {
        tabHeaders.forEach(header => {
          header.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Remover active de todos os headers e contents
            tabHeaders.forEach(h => h.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Adicionar active no header clicado
            this.classList.add('active');

            // Mostrar content correspondente
            const tabElement = document.getElementById(`${tabId}Tab`);
            if (tabElement) {
              tabElement.classList.add('active');
            }
          });
        });
      }

      // Botão de Comprar
      const buyNowBtn = document.getElementById('buyNowBtn');
      if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function () {
          const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

          // Obter tamanho selecionado
          let selectedSize = null;
          const activeSize = document.querySelector('.size-option.active');
          if (activeSize) {
            selectedSize = activeSize.getAttribute('data-size');
          }

          // Obter cor selecionada
          let selectedColor = null;
          const activeColor = document.querySelector('.color-option.active');
          if (activeColor) {
            selectedColor = activeColor.getAttribute('data-colorname');
          }

          const productData = {
            id: product.id,
            name: product.name,
            price: product.promotional_price || product.price,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity,
            image: mainImage ? mainImage.src : getImageUrl(product.image_url),
            category: getCategoryName(product.category_id)
          };

          // Adicionar ao carrinho
          addToCart(productData);

          // Feedback visual
          const originalHTML = buyNowBtn.innerHTML;
          buyNowBtn.innerHTML = '<i class="fas fa-check"></i> ADICIONADO!';
          buyNowBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';

          setTimeout(() => {
            buyNowBtn.innerHTML = originalHTML;
            buyNowBtn.style.background = '';
          }, 2000);

          // Atualizar contador do carrinho
          updateCartCount();
        });
      }

      // Botão de Favoritos
      const wishlistBtn = document.getElementById('wishlistBtn');
      if (wishlistBtn) {
        // Verificar se produto já está nos favoritos
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const isInWishlist = wishlist.find(item => item.id == product.id);

        if (isInWishlist) {
          const icon = wishlistBtn.querySelector('i');
          icon.classList.remove('far');
          icon.classList.add('fas');
          wishlistBtn.classList.add('active');
        }

        wishlistBtn.addEventListener('click', function () {
          const icon = this.querySelector('i');

          if (icon.classList.contains('far')) {
            // Adicionar aos favoritos
            icon.classList.remove('far');
            icon.classList.add('fas');
            this.classList.add('active');

            // Salvar nos favoritos
            saveToWishlist(product);
            showNotification('Produto adicionado aos favoritos!', 'success');
          } else {
            // Remover dos favoritos
            icon.classList.remove('fas');
            icon.classList.add('far');
            this.classList.remove('active');

            // Remover dos favoritos
            removeFromWishlist(product.id);
            showNotification('Produto removido dos favoritos', 'info');
          }
        });
      }
    }

    // ============================================
    // ===== FUNÇÕES DO CARRINHO =====
    // ============================================
    function addToCart(productData) {
      console.log("🛒 Adicionando ao carrinho:", productData);

      // Recuperar carrinho do localStorage
      let cart = JSON.parse(localStorage.getItem('cart')) || [];

      // Verificar se produto já está no carrinho (considerando tamanho e cor)
      const existingItemIndex = cart.findIndex(item =>
        item.id === productData.id &&
        item.size === productData.size &&
        item.color === productData.color
      );

      if (existingItemIndex > -1) {
        // Atualizar quantidade
        cart[existingItemIndex].quantity += productData.quantity;
      } else {
        // Adicionar novo item
        cart.push(productData);
      }

      // Salvar no localStorage
      localStorage.setItem('cart', JSON.stringify(cart));

      // Feedback
      showNotification('Produto adicionado ao carrinho!', 'success');
    }

    function updateCartCount() {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

      const cartCount = document.querySelector('.cart-count');
      if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.classList.add('pulse');

        setTimeout(() => {
          cartCount.classList.remove('pulse');
        }, 300);
      }
    }

    // ============================================
    // ===== FUNÇÕES DOS FAVORITOS =====
    // ============================================
    function saveToWishlist(product) {
      let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

      if (!wishlist.find(item => item.id === product.id)) {
        wishlist.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          category: getCategoryName(product.category_id),
          added_at: new Date().toISOString()
        });

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      }
    }

    function removeFromWishlist(productId) {
      let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      wishlist = wishlist.filter(item => item.id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    // ============================================
    // ===== FUNÇÃO DE NOTIFICAÇÃO =====
    // ============================================
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #1a002b, #0b0015);
          border: 2px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#7C3AED'};
          color: white;
          padding: 15px 25px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 15px;
          z-index: 1000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

      const icon = type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
          type === 'warning' ? 'exclamation-triangle' : 'info-circle';

      notification.innerHTML = `
          <i class="fas fa-${icon}" style="color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#7C3AED'}; font-size: 20px;"></i>
          <span>${message}</span>
        `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // ============================================
    // ===== FUNÇÃO PARA MOSTRAR ERRO =====
    // ============================================
    function showError(message) {
      document.getElementById('productContainer').innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ops! Algo deu errado</h3>
            <p>${message}</p>
            <button onclick="window.location.href='catalogo.html'" 
                    style="margin-top: 20px; padding: 10px 20px; background: #7C3AED; color: white; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-arrow-left"></i> Voltar ao Catálogo
            </button>
          </div>
        `;
    }

    // ============================================
    // ===== ANIMAÇÃO DE SCROLL =====
    // ============================================
    function setupScrollAnimation() {
      const revealElements = document.querySelectorAll('.reveal');

      function revealOnScroll() {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        revealElements.forEach(element => {
          const revealTop = element.getBoundingClientRect().top;

          if (revealTop < windowHeight - revealPoint) {
            element.classList.add('active');
          }
        });
      }

      window.addEventListener('scroll', revealOnScroll);
      revealOnScroll();
    }

    // ============================================
    // ===== FUNÇÃO PARA OBTER ID DA URL =====
    // ============================================
    function getProductIdFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id');
    }

    // ============================================
    // ===== INICIALIZAÇÃO =====
    // ============================================
    document.addEventListener('DOMContentLoaded', async function () {
      console.log("🚀 Página de detalhes iniciada");

      // Atualizar contador do carrinho
      updateCartCount();

      // Configurar animação de scroll
      setupScrollAnimation();

      // Obter ID do produto da URL
      const productId = getProductIdFromURL();

      if (!productId) {
        showError("Produto não encontrado. O ID não foi especificado na URL.");
        return;
      }

      try {
        // Carregar categorias
        allCategories = await fetchCategories();

        // Carregar produto
        currentProduct = await fetchProductById(productId);

        if (!currentProduct) {
          showError("Produto não encontrado ou foi removido.");
          return;
        }

        // Renderizar produto
        renderProduct(currentProduct);

        // Carregar produtos relacionados
        await loadRelatedProducts(currentProduct);

        console.log("✅ Produto carregado com sucesso:", currentProduct.name);

      } catch (error) {
        console.error("❌ Erro ao carregar produto:", error);
        showError("Não foi possível carregar as informações do produto. Tente novamente mais tarde.");
      }
    });
