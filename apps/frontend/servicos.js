// Configurações da página de serviços
document.addEventListener("DOMContentLoaded", function () {
  setupScrollAnimation();
  setupWhatsAppButtons();
});

// Configurar botões do WhatsApp
function setupWhatsAppButtons() {
  // Número do WhatsApp - SUBSTITUA PELO NÚMERO DO SEU AMIGO
  const whatsappNumber = "558182047692";

  // Mensagem padrão
  const defaultMessage = encodeURIComponent(
    "Olá! Gostaria de fazer um pedido personalizado na Universo Paralelo Store.\n\n" +
      "Tenho uma ideia para um projeto 3D e gostaria de conversar sobre:\n" +
      "• Tipo de objeto que quero criar\n" +
      "• Tamanho aproximado\n" +
      "• Cor/material preferido\n" +
      "• Prazo necessário\n\n" +
      "Podem me ajudar?",
  );

  // Atualizar todos os links do WhatsApp
  document.querySelectorAll('a[href*="whatsapp"]').forEach((link) => {
    link.href = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;
  });
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

// Contador do carrinho (opcional)
function updateCartCount() {
  const cart = JSON.parse(
    localStorage.getItem("universo_paralelo_cart") || '{"items": []}',
  );
  const cartCount = document.querySelector(".cart-count");
  if (cartCount) {
    const itemCount = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    cartCount.textContent = itemCount;
  }
}

// Atualizar contador do carrinho ao carregar
updateCartCount();
