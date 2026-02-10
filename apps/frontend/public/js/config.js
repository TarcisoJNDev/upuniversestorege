// Detectar ambiente
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// URL da sua API no Render
const RENDER_API_URL = "https://upuniversestorege.onrender.com/api";

// Configuração da API
const API_CONFIG = {
  // Usar Render em produção, localhost apenas em desenvolvimento
  BASE_URL: isLocalhost ? "http://localhost:5000/api" : RENDER_API_URL,

  // Configurações
  TIMEOUT: 30000,

  // Endpoints
  ENDPOINTS: {
    PRODUCTS: "/products",
    CATEGORIES: "/categories",
    CATEGORIES_WITH_COUNT: "/categories/with-count",
    UPLOADS: "/uploads",
    HEALTH: "/health",
  },
};

// Função para construir URL da API
function getApiUrl(endpoint) {
  return API_CONFIG.BASE_URL + endpoint;
}

// Função para construir URL de imagens
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "https://via.placeholder.com/400x400?text=Sem+Imagem";
  }

  // Se já for URL completa
  if (imagePath.startsWith("http") || imagePath.startsWith("data:image")) {
    return imagePath;
  }

  // Construir URL base
  const baseUrl = API_CONFIG.BASE_URL.replace("/api", "");

  // Se for caminho relativo
  if (imagePath.startsWith("/uploads/")) {
    return baseUrl + imagePath;
  }

  // Se for apenas nome do arquivo
  return baseUrl + "/uploads/" + imagePath;
}

// Testar conexão com a API
async function testApiConnection() {
  try {
    console.log("🔗 Testando conexão com API:", API_CONFIG.BASE_URL);

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH), {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API conectada:", data);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("⚠️ API offline:", error.message);
    return false;
  }
}

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
window.getImageUrl = getImageUrl;
window.testApiConnection = testApiConnection;

// Log inicial
console.log("🎯 Configuração carregada:", {
  ambiente: isLocalhost ? "local" : "produção",
  apiUrl: API_CONFIG.BASE_URL,
  host: window.location.hostname,
});

// Testar automaticamente (opcional)
setTimeout(testApiConnection, 1000);
